/**
 * GET /impersonate?token=...
 * Entry point used by the Super Admin panel to open a tenant's dashboard
 * logged in as that user. The token is a normal app JWT signed with the
 * shared JWT_SECRET; we verify it, set the same `token` cookie that login
 * sets, then redirect to the dashboard.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  try {
    verifyToken(token); // throws if invalid / expired
  } catch {
    return NextResponse.redirect(new URL('/login?error=invalid_session', req.url));
  }

  const res = NextResponse.redirect(new URL('/dashboard', req.url));
  res.cookies.set('token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
    path:     '/',
  });
  return res;
}
