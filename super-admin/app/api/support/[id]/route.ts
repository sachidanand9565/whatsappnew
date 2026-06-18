import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAdminFromCookies } from '@/lib/auth'
import { decryptIdNum } from '@/lib/idCrypto'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!getAdminFromCookies()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { status } = await req.json()
  await query('UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE id = ?', [status, decryptIdNum(params.id)])
  return NextResponse.json({ ok: true })
}
