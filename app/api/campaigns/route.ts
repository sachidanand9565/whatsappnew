/**
 * GET  /api/campaigns
 * POST /api/campaigns
 */
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query, insert, execute } from '@/lib/db';
import { apiSuccess, apiError, normalizePhone } from '@/lib/utils';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const date = req.nextUrl.searchParams.get('date'); // YYYY-MM-DD, optional

    // Subquery: accurate per-status counts from campaign_contacts
    // When `date` is given, counts are restricted to messages sent on that date
    const dateFilter = date ? 'WHERE DATE(sent_at) = ?' : '';
    const statsSub = `
      LEFT JOIN (
        SELECT campaign_id,
          COALESCE(SUM(status IN ('sent','delivered','read')), 0) AS cc_sent,
          COALESCE(SUM(status IN ('delivered','read')),        0) AS cc_delivered,
          COALESCE(SUM(status = 'read'),                       0) AS cc_read,
          COALESCE(SUM(status = 'failed'),                     0) AS cc_failed
        FROM campaign_contacts
        ${dateFilter}
        GROUP BY campaign_id
      ) cc_stats ON cc_stats.campaign_id = c.id`;

    const selectCols = `c.*, t.name as template_name,
      COALESCE(cc_stats.cc_sent,      0) AS cc_sent,
      COALESCE(cc_stats.cc_delivered, 0) AS cc_delivered,
      COALESCE(cc_stats.cc_read,      0) AS cc_read,
      COALESCE(cc_stats.cc_failed,    0) AS cc_failed`;

    const dateParams = date ? [date] : [];

    // Agents only see campaigns assigned to them
    if (payload.role === 'agent') {
      const campaigns = await query<RowDataPacket[]>(
        `SELECT ${selectCols}
         FROM campaigns c
         LEFT JOIN templates t ON t.id = c.template_id
         ${statsSub}
         JOIN campaign_assignments ca ON ca.campaign_id = c.id AND ca.agent_id = ?
         WHERE c.workspace_id = ?
         ORDER BY c.created_at DESC`,
        [...dateParams, payload.userId, payload.workspaceId]
      );
      return apiSuccess(campaigns);
    }

    const campaigns = await query<RowDataPacket[]>(
      `SELECT ${selectCols}
       FROM campaigns c
       LEFT JOIN templates t ON t.id = c.template_id
       ${statsSub}
       WHERE c.workspace_id = ?
       ORDER BY c.created_at DESC`,
      [...dateParams, payload.workspaceId]
    );
    return apiSuccess(campaigns);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError('Server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role === 'agent') return apiError('Agents cannot create campaigns', 403);

    const { name, template_id, scheduled_at, template_vars, contact_ids, campaign_type, csv_contacts } = await req.json();

    if (!name || !template_id) return apiError('Name and template are required');

    const validTypes = ['broadcast', 'api'];
    const type = validTypes.includes(campaign_type) ? campaign_type : 'broadcast';

    // Resolve contact IDs from CSV data if provided
    let resolvedContactIds: number[] = contact_ids || [];

    if (csv_contacts && Array.isArray(csv_contacts) && csv_contacts.length > 0) {
      // Normalize + dedupe rows once
      const cleanRows = csv_contacts
        .map((row: Record<string, string>) => ({
          phone:  normalizePhone(row.phone || ''),
          name:   row.name || null,
          email:  row.email || null,
          city:   row.city || null,
          source: row.source || 'csv_campaign',
        }))
        .filter((r: { phone: string }) => r.phone);

      // Bulk upsert in chunks (one query per ~500 rows instead of one per contact)
      const CHUNK = 500;
      for (let i = 0; i < cleanRows.length; i += CHUNK) {
        const chunk = cleanRows.slice(i, i + CHUNK);
        const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, 1)').join(',');
        const values = chunk.flatMap((r: { phone: string; name: string | null; email: string | null; city: string | null; source: string }) =>
          [payload.workspaceId, r.phone, r.name, r.email, r.city, r.source]
        );
        await execute(
          `INSERT IGNORE INTO contacts (workspace_id, phone, name, email, city, source, opted_in) VALUES ${placeholders}`,
          values
        );
      }

      // Collect all valid phones
      const validPhones = cleanRows.map((r: { phone: string }) => r.phone);

      if (validPhones.length > 0) {
        const placeholders = validPhones.map(() => '?').join(',');
        const contactRows = await query<RowDataPacket[]>(
          `SELECT id FROM contacts WHERE workspace_id = ? AND phone IN (${placeholders})`,
          [payload.workspaceId, ...validPhones]
        );
        resolvedContactIds = contactRows.map((r) => r.id as number);
      }
    }

    const id = await insert(
      `INSERT INTO campaigns (workspace_id, name, template_id, campaign_type, status, scheduled_at, template_vars, created_by, total_contacts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.workspaceId, name, template_id,
        type,
        scheduled_at ? 'scheduled' : 'draft',
        scheduled_at || null,
        JSON.stringify(template_vars || {}),
        payload.userId,
        resolvedContactIds.length,
      ]
    );

    // Add campaign contacts (parameterized - no SQL injection)
    if (resolvedContactIds.length > 0) {
      const placeholders = resolvedContactIds.map(() => '(?, ?)').join(',');
      const values = resolvedContactIds.flatMap((cid) => [id, cid]);
      await query(`INSERT IGNORE INTO campaign_contacts (campaign_id, contact_id) VALUES ${placeholders}`, values);
    }

    return apiSuccess({ id }, 201);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    console.error('[campaigns POST]', err);
    return apiError('Server error', 500);
  }
}
