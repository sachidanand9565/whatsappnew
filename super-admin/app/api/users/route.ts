import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAdminFromCookies } from '@/lib/auth'

export async function GET(req: Request) {
  if (!getAdminFromCookies()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const plan   = searchParams.get('plan') || ''   
  
  let sql = `
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
    WHERE 1=1
  `
  const params: any[] = []

  if (search) { sql += ' AND (u.name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }
  if (status === 'active')    { sql += ' AND w.is_active = 1' }
  if (status === 'suspended') { sql += ' AND w.is_active = 0' }
  if (plan)   { sql += ' AND w.plan = ?'; params.push(plan) }
  sql += ' ORDER BY u.created_at DESC LIMIT 100'

  try {
    const users = await query(sql, params)
    return NextResponse.json({ users })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
