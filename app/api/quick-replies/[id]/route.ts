/**
 * DELETE /api/quick-replies/[id]
 */
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { execute } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/utils';
import { decryptIdNum } from '@/lib/idCrypto';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = requireAuth(req);
    const id = decryptIdNum(params.id);
    await execute(
      'DELETE FROM quick_replies WHERE id = ? AND workspace_id = ?',
      [id, payload.workspaceId]
    );
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError('Server error', 500);
  }
}
