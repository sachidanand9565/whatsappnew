import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query, insert } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/utils';
import { RowDataPacket } from 'mysql2';

// GET /api/flows — list all flows
export async function GET(req: NextRequest) {
  try {
    const { workspaceId } = requireAuth(req);
    const flows = await query<RowDataPacket[]>(
      `SELECT id, name, description, trigger_keywords, trigger_type,
              is_active, triggered_count, completed_count, created_at, updated_at
       FROM flows WHERE workspace_id = ? ORDER BY updated_at DESC`,
      [workspaceId]
    );
    return apiSuccess(flows.map(f => ({
      ...f,
      trigger_keywords: typeof f.trigger_keywords === 'string'
        ? JSON.parse(f.trigger_keywords) : f.trigger_keywords,
    })));
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError(e?.message || 'Server error', 500);
  }
}

// POST /api/flows — create new flow
export async function POST(req: NextRequest) {
  try {
    const { workspaceId, userId } = requireAuth(req);
    const { name, description } = await req.json();
    if (!name?.trim()) return apiError('Name required', 400);

    const id = await insert(
      `INSERT INTO flows (workspace_id, name, description, created_by) VALUES (?,?,?,?)`,
      [workspaceId, name.trim(), description || null, userId]
    );
    return apiSuccess({ id });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError(e?.message || 'Server error', 500);
  }
}
