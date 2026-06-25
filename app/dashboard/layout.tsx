'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutDashboard, MessageSquare, Users, Megaphone,
  FileText, Bot, BarChart3, Settings, LogOut, Menu, X,
  History, CreditCard, UserCog, ChevronRight, Plus, Check,
  Headphones, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Role = 'admin' | 'manager' | 'agent';

interface Workspace { id: number; name: string; phone_number_id?: string; plan?: string; role?: string; }

const ALL_NAV = [
  { label: 'Dashboard',  href: '/dashboard',   icon: LayoutDashboard, roles: ['admin','manager','agent'] },
  { label: 'Inbox',      href: '/inbox',        icon: MessageSquare,   roles: ['admin','manager','agent'] },
  { label: 'History',    href: '/history',      icon: History,         roles: ['admin','manager','agent'] },
  { label: 'Contacts',   href: '/contacts',     icon: Users,           roles: ['admin','manager','agent'] },
  { label: 'Campaigns',  href: '/campaigns',    icon: Megaphone,       roles: ['admin','manager','agent'] },
  { label: 'Templates',  href: '/templates',    icon: FileText,        roles: ['admin','manager'] },
  { label: 'Chatbot',    href: '/chatbot',      icon: Bot,             roles: ['admin'] },
  { label: 'Flows',      href: '/flows',        icon: Zap,             roles: ['admin'] },
  { label: 'Analytics',  href: '/analytics',    icon: BarChart3,       roles: ['admin','manager'] },
  { label: 'Agents',     href: '/agents',       icon: UserCog,         roles: ['admin'] },
  { label: 'Billing',    href: '/billing',      icon: CreditCard,      roles: ['admin'] },
  { label: 'Settings',   href: '/settings',     icon: Settings,        roles: ['admin'] },
  { label: 'Support',    href: '/support',      icon: Headphones,      roles: ['admin','manager','agent'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [open, setOpen]         = useState(false);
  const [role, setRole]         = useState<Role>('admin');
  const [userName, setUserName] = useState('');

  const [workspaces, setWorkspaces]         = useState<Workspace[]>([]);
  const [currentWs, setCurrentWs]           = useState<Workspace | null>(null);
  const [showSwitcher, setShowSwitcher]     = useState(false);
  const [showNewModal, setShowNewModal]     = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating]             = useState(false);
  const [switching, setSwitching]           = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.replace('/login');
      return;
    }
    const r = (localStorage.getItem('userRole') || 'admin') as Role;
    setRole(r);
    setUserName(localStorage.getItem('userName') || '');

    const stored = localStorage.getItem('workspaces');
    const wsId   = Number(localStorage.getItem('workspaceId'));
    if (stored) {
      const list: Workspace[] = JSON.parse(stored);
      setWorkspaces(list);
      setCurrentWs(list.find((w) => w.id === wsId) || list[0] || null);
    } else {
      fetch('/api/workspaces', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
        .then((r) => r.json())
        .then((res) => {
          if (res?.data) {
            setWorkspaces(res.data);
            localStorage.setItem('workspaces', JSON.stringify(res.data));
            setCurrentWs(res.data.find((w: Workspace) => w.id === wsId) || res.data[0] || null);
          }
        });
    }
  }, [router]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setShowSwitcher(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function switchWorkspace(ws: Workspace) {
    if (ws.id === currentWs?.id || switching) return;
    setSwitching(true);
    try {
      const res  = await fetch('/api/workspace/switch', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body:    JSON.stringify({ workspaceId: ws.id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Switch failed'); return; }
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('workspaceId', String(ws.id));
      localStorage.setItem('userRole', data.data.role);
      setCurrentWs(ws);
      setRole(data.data.role as Role);
      setShowSwitcher(false);
      toast.success(`Switched to ${ws.name}`);
      window.location.href = '/dashboard';
    } finally {
      setSwitching(false);
    }
  }

  async function createProject() {
    if (!newProjectName.trim() || creating) return;
    setCreating(true);
    try {
      const res  = await fetch('/api/workspaces', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body:    JSON.stringify({ name: newProjectName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to create project'); return; }
      const newWs: Workspace = { id: data.data.id, name: data.data.name };
      const updated = [...workspaces, newWs];
      setWorkspaces(updated);
      localStorage.setItem('workspaces', JSON.stringify(updated));
      toast.success(`Project "${newWs.name}" created!`);
      setShowNewModal(false);
      setNewProjectName('');
      switchWorkspace(newWs);
    } finally {
      setCreating(false);
    }
  }

  const nav = ALL_NAV.filter((item) => item.roles.includes(role));

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('token');
    localStorage.removeItem('workspaceId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('workspaces');
    router.push('/login');
  }

  const roleBadgeColor: Record<Role, string> = {
    admin:   'bg-purple-600',
    manager: 'bg-green-600',
    agent:   'bg-green-500',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800">
      {/* Sidebar (Desktop Side Drawer / Mobile Slide-over Drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-44 bg-gradient-to-b from-[#021f12] via-[#05110a] to-[#010804] text-white flex flex-col border-r border-white/5 shadow-2xl
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5 border-b border-white/5 relative flex-shrink-0">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-green-400 rounded-full blur opacity-30 group-hover:opacity-75 transition duration-500" />
            <Image src="/logo.png" alt="SK WEBTECH" width={32} height={32} className="relative h-8 w-auto object-contain transition-transform group-hover:scale-105" />
          </div>
          <span className="font-extrabold text-white text-sm tracking-tight select-none">SK WEBTECH</span>
          <button className="absolute right-3 top-1/2 -translate-y-1/2 lg:hidden text-white/50 hover:text-white" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Project Switcher */}
        <div ref={switcherRef} className="relative px-3 py-4 border-b border-white/5 flex-shrink-0">
          <button
            onClick={() => setShowSwitcher((v) => !v)}
            title={currentWs?.name || 'Projects'}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 focus:outline-none group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-green-600 to-green-500 flex items-center justify-center text-white font-bold text-sm shadow-[0_2px_8px_rgba(22,163,74,0.2)] group-hover:scale-105 transition-transform flex-shrink-0">
                {currentWs ? currentWs.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-white truncate leading-snug">{currentWs?.name || 'Project'}</p>
                <p className="text-[9px] text-white/50 leading-none mt-0.5 uppercase tracking-wider font-extrabold">{currentWs?.plan || 'FREE'}</p>
              </div>
            </div>
            <ChevronRight size={14} className={`text-white/40 transition-transform duration-200 flex-shrink-0 ${showSwitcher ? 'rotate-90 text-white' : ''}`} />
          </button>

          {showSwitcher && (
            <div className="absolute left-4 right-4 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase px-4 pt-4 pb-2 tracking-wider">Your Projects</p>
              <ul className="max-h-56 overflow-y-auto px-2 pb-2 space-y-1">
                {workspaces.map((ws) => (
                  <li key={ws.id}>
                    <button
                      onClick={() => switchWorkspace(ws)}
                      disabled={switching}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-50 transition-all ${ws.id === currentWs?.id ? 'bg-green-50 border border-green-100' : 'border border-transparent'}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{ws.name}</p>
                        {ws.plan && <p className="text-[10px] text-slate-400 font-medium truncate">{ws.plan.toUpperCase()}</p>}
                      </div>
                      {ws.id === currentWs?.id && <Check size={14} className="text-green-600 flex-shrink-0" />}
                      {ws.id !== currentWs?.id && <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-slate-100 bg-slate-50/50 p-2">
                <button
                  onClick={() => { setShowSwitcher(false); setShowNewModal(true); }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs text-green-600 bg-white border border-slate-200 font-bold shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <Plus size={14} />
                  New Project
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nav list */}
        <nav className="flex-1 py-4 overflow-y-auto space-y-1 px-3" style={{ scrollbarWidth: 'none' }}>
          {nav.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href} href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all relative group font-sans
                  ${active
                    ? 'bg-green-500/10 text-green-400 font-bold border-l-4 border-green-400 rounded-l-none'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon size={18} className={`transition-transform duration-200 flex-shrink-0 ${active ? 'text-green-400 scale-105' : 'text-white/40 group-hover:text-white'}`} />
                <span className="text-xs tracking-wide font-semibold mt-0.5">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/5 flex-shrink-0">
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all font-sans font-semibold group">
            <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform flex-shrink-0" />
            <span className="text-xs mt-0.5">Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile drawer */}
      {open && (
        <div className="fixed inset-0 bg-black/45 z-40 lg:hidden backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">New Project</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Project Name</label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createProject()}
              placeholder="e.g. My Business"
              className="input w-full mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowNewModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={createProject} disabled={creating || !newProjectName.trim()} className="btn-primary flex-1">
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative">
        {/* Sticky Mobile/Desktop Top Header bar */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/50 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-500 hover:text-slate-900 focus:outline-none" onClick={() => setOpen(true)}>
              <Menu size={22} />
            </button>
            <div className="flex flex-col">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                {currentWs?.name || 'Project'}
              </span>
              <h2 className="font-black text-slate-900 text-base sm:text-lg tracking-tight mt-1">
                {nav.find((n) => pathname.startsWith(n.href))?.label || 'Dashboard'}
              </h2>
            </div>
          </div>
          
          {userName && (
            <div className="flex items-center gap-3">
              <span className={`text-[9px] font-bold text-white px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm hidden sm:inline-block ${roleBadgeColor[role]}`}>
                {role}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-800 border border-green-200 flex items-center justify-center font-bold text-xs">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-slate-700 hidden sm:block">{userName}</span>
              </div>
            </div>
          )}
        </header>

        {/* Page Main Content Area */}
        {/* On mobile (below lg) we add pb-24 padding-bottom so content isn't blocked by bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6 bg-slate-50/20">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (APK/App Vibe) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] px-2 py-2 pb-safe">
          <div className="flex items-center justify-around">
            
            {/* Dashboard Link */}
            <Link 
              href="/dashboard" 
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition ${pathname === '/dashboard' ? 'text-green-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutDashboard size={20} className={pathname === '/dashboard' ? 'text-green-600 scale-105 transition-transform' : 'text-slate-400'} />
              <span className="text-[9px] mt-1 font-bold tracking-tight">Home</span>
            </Link>

            {/* Inbox Link */}
            <Link 
              href="/inbox" 
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition relative ${pathname.startsWith('/inbox') ? 'text-green-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <MessageSquare size={20} className={pathname.startsWith('/inbox') ? 'text-green-600 scale-105 transition-transform' : 'text-slate-400'} />
              <span className="text-[9px] mt-1 font-bold tracking-tight">Inbox</span>
            </Link>

            {/* Campaigns Link */}
            <Link 
              href="/campaigns" 
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition relative ${pathname.startsWith('/campaigns') ? 'text-green-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Megaphone size={20} className={pathname.startsWith('/campaigns') ? 'text-green-600 scale-105 transition-transform' : 'text-slate-400'} />
              <span className="text-[9px] mt-1 font-bold tracking-tight">Campaigns</span>
            </Link>

            {/* Contacts Link */}
            <Link 
              href="/contacts" 
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition ${pathname.startsWith('/contacts') ? 'text-green-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Users size={20} className={pathname.startsWith('/contacts') ? 'text-green-600 scale-105 transition-transform' : 'text-slate-400'} />
              <span className="text-[9px] mt-1 font-bold tracking-tight">Contacts</span>
            </Link>

            {/* More Button (Slides in the drawer menu) */}
            <button 
              onClick={() => setOpen(true)} 
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition ${open ? 'text-green-600' : 'text-slate-400'}`}
            >
              <Menu size={20} className={open ? 'text-green-600' : 'text-slate-400'} />
              <span className="text-[9px] mt-1 font-bold tracking-tight">More</span>
            </button>
            
          </div>
        </div>

      </div>
    </div>
  );
}
