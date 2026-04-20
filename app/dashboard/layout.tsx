'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, MessageSquare, Users, Megaphone,
  FileText, Bot, BarChart3, Settings, LogOut, Menu, X, History, CreditCard
} from 'lucide-react';

const nav = [
  { label: 'Dashboard',  href: '/dashboard',   icon: LayoutDashboard },
  { label: 'Inbox',      href: '/inbox',        icon: MessageSquare },
  { label: 'History',    href: '/history',      icon: History },
  { label: 'Contacts',   href: '/contacts',     icon: Users },
  { label: 'Campaigns',  href: '/campaigns',    icon: Megaphone },
  { label: 'Templates',  href: '/templates',    icon: FileText },
  { label: 'Chatbot',    href: '/chatbot',      icon: Bot },
  { label: 'Analytics',  href: '/analytics',    icon: BarChart3 },
  { label: 'Billing',    href: '/billing',      icon: CreditCard },
  { label: 'Settings',   href: '/settings',     icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) router.replace('/login');
  }, [router]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('token');
    localStorage.removeItem('workspaceId');
    router.push('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-16 bg-whatsapp-dark text-white flex flex-col
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-auto
      `}>
        {/* Logo */}
        <div className="flex items-center justify-center py-4 border-b border-white/10">
          <span className="text-xl">💬</span>
          <button className="absolute right-2 lg:hidden" onClick={() => setOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto scrollbar-hide" style={{scrollbarWidth:'none'}}>
          {nav.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href} href={href}
                onClick={() => setOpen(false)}
                className={`flex flex-col items-center justify-center py-2.5 gap-1 transition-colors
                  ${active ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
              >
                <Icon size={18} />
                <span className="text-[9px] font-medium leading-none">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="flex items-center justify-center py-4 border-t border-white/10">
          <button onClick={logout}
            className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors">
            <LogOut size={18} />
            <span className="text-[9px] font-medium leading-none">Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center gap-4">
          <button className="lg:hidden text-gray-600 hover:text-gray-900" onClick={() => setOpen(true)}>
            <Menu size={22} />
          </button>
          <h2 className="font-semibold text-gray-800 capitalize">
            {nav.find((n) => pathname.startsWith(n.href))?.label || 'Dashboard'}
          </h2>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
