'use client';
/**
 * /impersonate?token=...
 * Entry point used by the Super Admin panel to open a tenant's dashboard logged
 * in AS that user. The app authenticates client-side via the localStorage `token`
 * (apiFetch sends it as a Bearer header), so we must overwrite localStorage here —
 * setting only the cookie isn't enough when another account is already logged in.
 */
import { useEffect, useState } from 'react';

function decodeJwt(token: string): { role?: string; email?: string; workspaceId?: number } {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch {
    return {};
  }
}

export default function ImpersonatePage() {
  const [error, setError] = useState('');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) { setError('Missing session token'); return; }

    const p = decodeJwt(token);

    // Replace ALL auth state so the previously logged-in account doesn't win
    localStorage.removeItem('workspaces');
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', p.role || 'admin');
    localStorage.setItem('workspaceId', p.workspaceId ? String(p.workspaceId) : '');
    localStorage.setItem('userName', p.email || '');

    // Also set the cookie (used for any server-side/SSR auth)
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;

    // Hard navigation so the app boots fresh with the new identity
    window.location.replace('/dashboard');
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-3 text-slate-500">
      {error ? (
        <>
          <p className="font-semibold text-red-500">{error}</p>
          <a href="/login" className="text-sm text-green-600 underline">Go to login</a>
        </>
      ) : (
        <>
          <div className="animate-spin w-7 h-7 border-4 border-green-600 border-t-transparent rounded-full" />
          <p className="text-sm">Opening user panel…</p>
        </>
      )}
    </div>
  );
}
