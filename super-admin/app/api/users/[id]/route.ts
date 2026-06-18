import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAdminFromCookies } from '@/lib/auth'
import { decryptIdNum } from '@/lib/idCrypto'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!getAdminFromCookies()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = decryptIdNum(params.id)
  const user = await queryOne(`
    SELECT u.id, u.name, u.email, u.created_at,
           w.id AS workspace_id,
           w.name AS workspace_name,
           w.plan,
           w.phone_number_id,
           w.waba_id,
           IF(w.is_active = 1, 'active', 'suspended') AS status,
           (SELECT COUNT(*) FROM messages m WHERE m.workspace_id = w.id) AS message_count,
           (SELECT COUNT(*) FROM contacts c WHERE c.workspace_id = w.id) AS contact_count,
           (SELECT MAX(created_at) FROM messages m2 WHERE m2.workspace_id = w.id) AS last_active
    FROM users u
    JOIN workspaces w ON w.owner_id = u.id
    WHERE u.id = ?
  `, [userId])

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ user })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!getAdminFromCookies()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updates: string[] = []
  const values: any[] = []

  if (body.plan !== undefined) {
    updates.push('plan = ?')
    values.push(body.plan)
  }
  if (body.status !== undefined) {
    updates.push('is_active = ?')
    values.push(body.status === 'active' ? 1 : 0)
  }

  if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  values.push(decryptIdNum(params.id))
  await query(`UPDATE workspaces SET ${updates.join(', ')} WHERE owner_id = ?`, values)
  return NextResponse.json({ ok: true })
}
