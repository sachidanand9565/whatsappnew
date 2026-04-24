/**
 * GET  /api/contacts  — list contacts (paginated, filterable)
 * POST /api/contacts  — create contact
 */
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query, insert } from '@/lib/db';
import { apiSuccess, apiError, getPagination, normalizePhone } from '@/lib/utils';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const sp      = new URL(req.url).searchParams;
    const { limit, offset, page } = getPagination(sp);
    const search     = sp.get('search') || '';
    const status     = sp.get('status') || '';
    const chatStatus = sp.get('chatStatus') || '';

    // Agents see:
    //  1. Contacts directly assigned to them (via transfer)
    //  2. Contacts from their campaigns that haven't been transferred to someone else
    const agentFilterMain  = payload.role === 'agent'
      ? `AND (
           c.assigned_agent_id = ${payload.userId}
           OR (
             c.assigned_agent_id IS NULL
             AND c.id IN (
               SELECT cc.contact_id FROM campaign_contacts cc
               JOIN campaign_assignments ca ON ca.campaign_id = cc.campaign_id
               WHERE ca.agent_id = ${payload.userId}
             )
           )
         )`
      : '';
    const agentFilterCount = payload.role === 'agent'
      ? `AND (
           assigned_agent_id = ${payload.userId}
           OR (
             assigned_agent_id IS NULL
             AND id IN (
               SELECT cc.contact_id FROM campaign_contacts cc
               JOIN campaign_assignments ca ON ca.campaign_id = cc.campaign_id
               WHERE ca.agent_id = ${payload.userId}
             )
           )
         )`
      : '';

    let sql    = `
      SELECT c.*,
        (SELECT u.name FROM users u WHERE u.id = c.assigned_agent_id LIMIT 1) AS assigned_agent_name,
        (SELECT COUNT(*) FROM messages m
         WHERE m.contact_id = c.id AND m.direction = 'inbound'
           AND m.id > COALESCE(
             (SELECT MAX(m2.id) FROM messages m2
              WHERE m2.contact_id = c.id AND m2.direction = 'outbound'),
             0
           )
        ) AS unread_count,
        (SELECT COUNT(*) FROM messages mi
         WHERE mi.contact_id = c.id AND mi.direction = 'inbound'
        ) AS inbound_count,
        (SELECT MAX(m3.created_at) FROM messages m3 WHERE m3.contact_id = c.id) AS last_message_at
      FROM contacts c WHERE c.workspace_id = ? ${agentFilterMain}`;
    let countSql = `SELECT COUNT(*) as total FROM contacts WHERE workspace_id = ? ${agentFilterCount}`;
    const params: unknown[] = [payload.workspaceId];

    if (search) {
      sql       += ' AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)';
      countSql  += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      sql      += ' AND c.status = ?';
      countSql += ' AND status = ?';
      params.push(status);
    }
    if (chatStatus === 'resolved') {
      sql      += " AND c.chat_status = 'resolved'";
      countSql += " AND chat_status = 'resolved'";
    } else if (chatStatus === 'active') {
      sql      += " AND (c.chat_status IS NULL OR c.chat_status != 'resolved')";
      countSql += " AND (chat_status IS NULL OR chat_status != 'resolved')";
    } else if (chatStatus === 'inbox') {
      // Only contacts who have sent an INBOUND message within 24h appear in inbox.
      // Outbound-only contacts (campaign recipients who haven't replied) stay in History.
      // Transferred contacts: only visible to the assigned agent (hide from everyone else).
      sql += ` AND EXISTS (
          SELECT 1 FROM messages m
          WHERE m.contact_id = c.id
          AND m.direction = 'inbound'
          AND m.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        )
        AND (c.assigned_agent_id IS NULL OR c.assigned_agent_id = ${payload.userId})`;
      countSql += ` AND EXISTS (
          SELECT 1 FROM messages m
          WHERE m.contact_id = id
          AND m.direction = 'inbound'
          AND m.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        )
        AND (assigned_agent_id IS NULL OR assigned_agent_id = ${payload.userId})`;
    } else if (chatStatus === 'history') {
      // Contacts with no inbound message in last 24h (exact inverse of inbox)
      sql += ` AND NOT EXISTS (
          SELECT 1 FROM messages m
          WHERE m.contact_id = c.id
          AND m.direction = 'inbound'
          AND m.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        )`;
      countSql += ` AND NOT EXISTS (
          SELECT 1 FROM messages m
          WHERE m.contact_id = id
          AND m.direction = 'inbound'
          AND m.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        )`;
    }

    sql += ' ORDER BY last_message_at DESC, c.created_at DESC LIMIT ? OFFSET ?';
    const listParams  = [...params, limit, offset];
    const countParams = params;

    const [contacts, countResult] = await Promise.all([
      query<RowDataPacket[]>(sql, listParams),
      query<RowDataPacket[]>(countSql, countParams),
    ]);

    const total = (countResult[0] as RowDataPacket).total as number;

    return apiSuccess({
      data:       contacts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    console.error('[contacts GET]', err);
    return apiError('Server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { name, phone, email, city, source, status, tags, notes } = await req.json();

    if (!phone) return apiError('Phone number is required');
    const normalizedPhone = normalizePhone(phone);

    // Check duplicate
    const existing = await query<RowDataPacket[]>(
      'SELECT id FROM contacts WHERE workspace_id = ? AND phone = ?',
      [payload.workspaceId, normalizedPhone]
    );
    if (existing.length > 0) return apiError('Contact with this phone already exists', 409);

    const id = await insert(
      `INSERT INTO contacts (workspace_id, name, phone, email, city, source, status, tags, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.workspaceId,
        name || null, normalizedPhone,
        email || null, city || null, source || 'manual',
        status || 'new',
        JSON.stringify(tags || []),
        notes || null,
      ]
    );

    return apiSuccess({ id }, 201);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    console.error('[contacts POST]', err);
    return apiError('Server error', 500);
  }
}
