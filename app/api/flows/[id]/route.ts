import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/utils';
import { decryptId } from '@/lib/idCrypto';
import { RowDataPacket } from 'mysql2';

// GET /api/flows/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { workspaceId } = requireAuth(req);
    const rows = await query<RowDataPacket[]>(
      'SELECT * FROM flows WHERE id = ? AND workspace_id = ? LIMIT 1',
      [decryptId(params.id), workspaceId]
    );
    if (!rows.length) return apiError('Not found', 404);
    const f = rows[0];
    return apiSuccess({
      ...f,
      trigger_keywords: typeof f.trigger_keywords === 'string' ? JSON.parse(f.trigger_keywords) : f.trigger_keywords,
      nodes: typeof f.nodes === 'string' ? JSON.parse(f.nodes) : f.nodes,
      edges: typeof f.edges === 'string' ? JSON.parse(f.edges) : f.edges,
    });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError(e?.message || 'Server error', 500);
  }
}

// PUT /api/flows/[id] — save flow (nodes + edges + settings)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { workspaceId } = requireAuth(req);
    const body = await req.json();
    const { name, description, trigger_keywords, trigger_type, nodes, edges, is_active } = body;

    await execute(
      `UPDATE flows SET
        name             = COALESCE(?, name),
        description      = COALESCE(?, description),
        trigger_keywords = COALESCE(?, trigger_keywords),
        trigger_type     = COALESCE(?, trigger_type),
        nodes            = COALESCE(?, nodes),
        edges            = COALESCE(?, edges),
        is_active        = COALESCE(?, is_active),
        version          = version + 1
       WHERE id = ? AND workspace_id = ?`,
      [
        name || null,
        description || null,
        trigger_keywords ? JSON.stringify(trigger_keywords) : null,
        trigger_type || null,
        nodes ? JSON.stringify(nodes) : null,
        edges ? JSON.stringify(edges) : null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        decryptId(params.id), workspaceId,
      ]
    );
    return apiSuccess({ ok: true });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError(e?.message || 'Server error', 500);
  }
}

// DELETE /api/flows/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { workspaceId } = requireAuth(req);
    await execute('DELETE FROM flows WHERE id = ? AND workspace_id = ?', [decryptId(params.id), workspaceId]);
    return apiSuccess({ ok: true });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError(e?.message || 'Server error', 500);
  }
}
