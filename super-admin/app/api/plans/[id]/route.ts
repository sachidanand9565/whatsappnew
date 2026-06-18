import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAdminFromCookies } from '@/lib/auth'
import { decryptIdNum } from '@/lib/idCrypto'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!getAdminFromCookies()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, price_monthly, price_yearly, max_contacts, max_messages_per_month, max_agents, features, is_active } = await req.json()
  await query(
    'UPDATE admin_plans SET name=?, price_monthly=?, price_yearly=?, max_contacts=?, max_messages_per_month=?, max_agents=?, features=?, is_active=? WHERE id=?',
    [name, price_monthly, price_yearly, max_contacts, max_messages_per_month, max_agents, JSON.stringify(features || []), is_active ? 1 : 0, decryptIdNum(params.id)]
  )
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!getAdminFromCookies()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await query('DELETE FROM admin_plans WHERE id = ?', [decryptIdNum(params.id)])
  return NextResponse.json({ ok: true })
}
