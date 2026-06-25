'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/hooks/useApi';
import {
  MessageSquare, Users, Megaphone, CheckCircle, BookOpen,
  TrendingUp, Facebook, Settings, RefreshCw,
  Copy, ExternalLink, BarChart3, Bot, ChevronRight, Wifi, WifiOff,
  Sparkles, ShieldCheck, CreditCard, ArrowUpRight, Zap, Wallet, Plus,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

interface Workspace {
  id: number;
  name: string;
  phone_number_id: string;
  phone_display: string;
  waba_id: string;
  plan: string;
  is_active: number;
  verify_token: string;
}

interface Summary { 
  total_messages_sent: number;
  delivery_rate: number;
  read_rate: number;
  total_contacts: number;
  new_contacts_today: number;
  active_campaigns: number;
  converted_leads: number;
  messages_failed: number;
}

interface WaStatus {
  connected:      boolean;
  is_live?:       boolean;
  phone_status?:  string;
  account_review_status?: string | null;
  phone_number?:  string;
  verified_name?: string;
  name_status?:   string;
  name_declined?: boolean;
  quality?:       { label: string; color: string };
  quota?:         string | null;
  api_error?:     string;
}

export default function DashboardPage() {
  const [workspace, setWorkspace]   = useState<Workspace | null>(null);
  const [summary, setSummary]       = useState<Summary | null>(null);
  const [chartData, setChartData]   = useState<{ date: string; sent: number; received: number }[]>([]);
  const [loading, setLoading]       = useState(true);
  const [wsLoading, setWsLoading]   = useState(true);
  const [waStatus, setWaStatus]     = useState<WaStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [userRole, setUserRole]     = useState('');
  const [greeting, setGreeting]     = useState('Welcome back');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  // Credentials are saved in our DB (app can talk to the Cloud API)
  const isConnected = !!(workspace?.phone_number_id && workspace?.waba_id);
  // Meta has actually approved the number for live sending (status === 'CONNECTED').
  // While Meta review is pending, isConnected is true but isLive is false.
  const isLive = isConnected && !statusLoading && !!waStatus?.is_live;
  const isPendingApproval = isConnected && !statusLoading && waStatus?.connected && !waStatus?.is_live;

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || '');

    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    apiFetch('/api/workspace').then((r) => {
      if (r?.data) setWorkspace(r.data);
    }).finally(() => setWsLoading(false));

    apiFetch('/api/workspace/status').then((r) => {
      if (r?.data) setWaStatus(r.data);
    }).finally(() => setStatusLoading(false));

    apiFetch('/api/analytics').then((r) => {
      if (r?.data) {
        setSummary(r.data.summary);
        setChartData(r.data.charts.daily_messages);
      }
    }).finally(() => setLoading(false));

    apiFetch('/api/wallet').then((r) => {
      if (r?.data) setWalletBalance(r.data.balance);
    }).finally(() => setWalletLoading(false));
  }, []);

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  }

  const planColor: Record<string, string> = {
    FREE:       'from-slate-100 to-slate-200 text-slate-700 border-slate-300/60',
    PRO:        'from-blue-50 to-blue-100 text-blue-700 border-blue-200/60',
    ENTERPRISE: 'from-purple-50 to-purple-100 text-purple-700 border-purple-200/60',
  };
  const plan = (workspace?.plan || 'FREE').toUpperCase();

  // Custom Chart Tooltip (Light Theme)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-xl">
          <p className="text-xs font-bold text-slate-800 mb-1">{label}</p>
          <p className="text-xs font-semibold text-emerald-600">Sent: {payload[0].value}</p>
          <p className="text-xs font-semibold text-cyan-600">Received: {payload[1].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/80 border border-slate-200/60 rounded-2xl p-5 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{greeting},</p>
            <h1 className="text-xl font-black text-slate-900 tracking-tight truncate mt-0.5">
              {workspace?.name || 'Dashboard'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* API Status pill */}
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
            isConnected
              ? 'bg-emerald-50 border-emerald-200/80 text-emerald-700 glow-emerald-sm'
              : 'bg-rose-50 border-rose-200/80 text-rose-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
            {isConnected
              ? <><Wifi size={13} /> CLOUD API: ONLINE</>
              : <><WifiOff size={13} /> CLOUD API: DISCONNECTED</>}
          </div>

          {/* Plan badge */}
          <span className={`bg-gradient-to-tr px-3.5 py-2 rounded-xl text-xs font-black tracking-wide border shadow-sm ${planColor[plan] || planColor.FREE}`}>
            {plan} PLAN
          </span>

          <Link href="/settings"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">
            <Settings size={13} /> Settings
          </Link>
        </div>
      </div>

      {/* ── Main Grid Layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left Content (2 Columns) ─────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Connection Control Hub */}
          <div className={`glass-card p-6 overflow-hidden relative group ${
            isConnected
              ? 'border-emerald-500/15 bg-gradient-to-br from-white via-white to-emerald-50/20 shadow-lg shadow-slate-100/50'
              : 'border-amber-500/15 bg-gradient-to-br from-white via-white to-amber-50/20 shadow-lg shadow-slate-100/50'
          }`}>
            {/* Ambient Background Glow */}
            <div className={`absolute -right-24 -top-24 w-48 h-48 rounded-full blur-3xl opacity-10 transition-all duration-500 group-hover:scale-110 ${
              isConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`} />

            <div className="relative flex flex-wrap gap-6 justify-between items-start">
              <div className="space-y-4 flex-1 min-w-[280px]">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className={isConnected ? 'text-emerald-600' : 'text-amber-600'} />
                  <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">WhatsApp Control Hub</span>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {isConnected && (
                    <>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quality</p>
                        {statusLoading ? (
                          <div className="h-5 w-16 bg-slate-100 animate-pulse rounded mt-1" />
                        ) : (
                          <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md mt-1 border ${
                            waStatus?.quality?.color === 'green'  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'  :
                            waStatus?.quality?.color === 'yellow' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            waStatus?.quality?.color === 'red'    ? 'bg-rose-50 text-rose-750 border-rose-100' :
                                                                     'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>
                            {waStatus?.quality?.label || 'High'}
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Message limit</p>
                        {statusLoading ? (
                          <div className="h-5 w-20 bg-slate-100 animate-pulse rounded mt-1" />
                        ) : (
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{waStatus?.quota || '1K / Day'}</p>
                        )}
                      </div>
                    </>
                  )}

                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone number</p>
                    <p className="text-sm font-mono font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                      {workspace?.phone_display || workspace?.phone_number_id ? (
                        <>
                          {workspace.phone_display || workspace.phone_number_id}
                          <button onClick={() => copyText(workspace.phone_display || workspace.phone_number_id)} className="text-slate-400 hover:text-slate-700 transition-colors" title="Copy Number">
                            <Copy size={12} />
                          </button>
                        </>
                      ) : (
                        '—'
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verified Business Name</p>
                    <p className="text-xs font-semibold text-slate-600 mt-1">
                      {waStatus?.verified_name || workspace?.name || 'Verified Account'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end">
                {!isConnected ? (
                  <Link href="/settings"
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-blue-500/10 transition-all hover:-translate-y-0.5 active:translate-y-0">
                    <Facebook size={15} /> Connect Business Phone
                  </Link>
                ) : statusLoading ? (
                  <div className="h-9 w-32 bg-slate-100 animate-pulse rounded-xl" />
                ) : isLive ? (
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Connection Status</span>
                    <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 glow-emerald-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      SECURE LIVE
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Connection Status</span>
                    <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      PENDING META APPROVAL
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Verification / error panels */}
            {isPendingApproval && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-center gap-2">
                <span className="text-base shrink-0">⏳</span>
                <p>
                  Credentials are saved and working, but Meta is still reviewing your business/number
                  {waStatus?.phone_status ? ` (status: ${waStatus.phone_status})` : ''}. Full live sending unlocks once Meta approves it — this usually takes a few hours to a couple of days.
                </p>
              </div>
            )}

            {waStatus?.api_error && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-center gap-2">
                <span className="text-base shrink-0">⚠️</span>
                <p><strong>Meta Alert:</strong> {waStatus.api_error}</p>
              </div>
            )}

            {waStatus?.name_declined && (
              <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-700 flex items-start gap-2.5">
                <span className="text-base shrink-0">⚠️</span>
                <div>
                  <strong>Display name verification declined by Meta:</strong>
                  <p className="text-rose-600/90 mt-0.5">Please check WhatsApp Accounts & Profile sections in Meta Business Manager to update the display name.</p>
                </div>
              </div>
            )}
          </div>

          {/* Core Metrics Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card h-24 animate-pulse bg-white" />
              ))}
            </div>
          ) : summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Messages Sent',    value: summary.total_messages_sent, icon: MessageSquare, color: 'text-emerald-600 border-emerald-100 bg-emerald-50' },
                { label: 'Total Contacts',   value: summary.total_contacts,       icon: Users,         color: 'text-violet-600 border-violet-100 bg-violet-50' },
                { label: 'Delivery Rate',    value: `${summary.delivery_rate}%`,  icon: CheckCircle,   color: 'text-cyan-600 border-cyan-100 bg-cyan-50' },
                { label: 'Active Campaigns', value: summary.active_campaigns,     icon: Megaphone,     color: 'text-amber-600 border-amber-100 bg-amber-50' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="glass-card glass-card-hover flex items-center gap-4 p-5 bg-white/70 border-slate-200/50 shadow-md shadow-slate-100/50 group relative overflow-hidden">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${color} transition-transform group-hover:scale-105`}>
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">{label}</p>
                    <p className="text-2xl font-black text-slate-800 mt-2 tracking-tight leading-none">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Interactive Chart Container */}
          <div className="glass-card bg-white/80 border-slate-200/50 p-6 relative shadow-lg shadow-slate-100/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                  <BarChart3 size={18} className="text-emerald-600" /> Message Volume
                </h2>
                <p className="text-[11px] text-slate-400 font-bold mt-0.5">Performance index over the last 7 days</p>
              </div>
              <button
                onClick={() => {
                  setLoading(true);
                  apiFetch('/api/analytics').then((r) => {
                    if (r?.data) setChartData(r.data.charts.daily_messages);
                  }).finally(() => setLoading(false));
                }}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-50 p-1.5 rounded-lg transition-colors border border-slate-100 hover:border-slate-200"
                title="Refresh Chart"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-slate-400 text-sm font-bold">No messages registered yet.</p>
                <Link href="/campaigns" className="text-xs text-emerald-600 hover:text-emerald-500 font-bold mt-2 flex items-center gap-1">
                  Launch a new campaign <ChevronRight size={12} />
                </Link>
              </div>
            ) : (
              <div className="w-full h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={12} barGap={4}>
                    <defs>
                      <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.01)', radius: 4 }} />
                    <Bar dataKey="sent" name="Sent" fill="url(#sentGrad)" radius={[4,4,0,0]} />
                    <Bar dataKey="received" name="Received" fill="url(#recGrad)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Broadcast Campaigns', href: '/campaigns', icon: Megaphone, desc: 'Send bulk templates to contacts', color: 'text-amber-600 bg-amber-50 border-amber-100' },
              { title: 'Audience CRM',      href: '/contacts',  icon: Users,     desc: 'Manage lists & client filters',   color: 'text-violet-600 bg-violet-50 border-violet-100' },
              { title: 'Interactive Flow',   href: '/flows',     icon: Zap,       desc: 'Build visual chat execution',    color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="glass-card glass-card-hover bg-white/70 border-slate-200/50 shadow-md shadow-slate-100/50 flex items-center justify-between p-5 group cursor-pointer">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${item.color}`}>
                    <item.icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors leading-normal">{item.title}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 leading-snug truncate">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>

        </div>

        {/* ── Right Sidebar (1 Column) ─────────────────────────── */}
        <div className="space-y-6">

          {/* Wallet Card */}
          <div className="glass-card bg-white border-slate-200 shadow-md p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Wallet size={12} /> Wallet Balance
              </span>
              <Link href="/wallet" className="text-xs text-emerald-600 font-bold hover:underline">
                History
              </Link>
            </div>

            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
              <div className="space-y-0.5">
                <p className="text-xs text-slate-400 font-bold">Available Credits</p>
                {walletLoading ? (
                  <div className="h-6 w-20 bg-slate-200 animate-pulse rounded mt-1" />
                ) : (
                  <p className={`text-xl font-black tracking-wide ${(walletBalance || 0) <= 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                    ₹{(walletBalance || 0).toFixed(2)}
                  </p>
                )}
              </div>
              <Link href="/wallet"
                className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm">
                <Plus size={11} /> Add
              </Link>
            </div>

            {!walletLoading && (walletBalance || 0) <= 0 && (
              <p className="text-[11px] text-rose-600 font-semibold">Wallet empty — template messages are blocked until you recharge.</p>
            )}
          </div>

          {/* Premium Account Profile Card */}
          <div className="glass-card bg-white border-slate-200 shadow-lg shadow-slate-100/50 overflow-hidden relative group">
            {/* Lush Dark Gradient Banner */}
            <div className="bg-gradient-to-br from-[#0c2f1e] via-[#051c11] to-[#081e13] px-5 py-5 border-b border-white/5 relative">
              <div className="absolute top-2 right-2">
                <Link href="/settings" className="text-white/60 hover:text-white transition-colors">
                  <ExternalLink size={13} />
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 border border-white/10 flex items-center justify-center text-white font-extrabold text-lg shadow-md shrink-0">
                  {workspace?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-white leading-tight truncate">
                    {wsLoading ? '—' : (workspace?.name || 'My Business')}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-extrabold tracking-widest uppercase mt-0.5">{plan} ACCOUNT</p>
                </div>
              </div>
            </div>

            {/* Profile Body */}
            <div className="p-5 space-y-4 bg-white/60">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account Mode</span>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    CONNECTED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md tracking-wider">
                    OFFLINE
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Direct number link</span>
                {workspace?.phone_display || workspace?.phone_number_id ? (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mt-1.5">
                    <p className="text-xs font-mono font-bold text-slate-800 truncate">
                      {workspace.phone_display || workspace.phone_number_id}
                    </p>
                    <button onClick={() => copyText(workspace.phone_display || workspace.phone_number_id)} className="text-slate-400 hover:text-slate-700 transition-colors" title="Copy">
                      <Copy size={11} />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic mt-1">No number connected yet</p>
                )}
              </div>

              <Link href="/settings"
                className="flex items-center justify-center gap-1 text-[11px] font-extrabold text-emerald-600 hover:text-emerald-500 transition-colors py-1">
                Configure WhatsApp Integrations <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>

          {/* Current Plan Card */}
          <div className="glass-card bg-white border-slate-200 shadow-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Workspace Plan</span>
              <Link href="/billing" className="text-xs text-emerald-600 font-bold hover:underline">
                Billing Manager
              </Link>
            </div>

            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
              <div className="space-y-0.5">
                <p className="text-xs text-slate-400 font-bold">Active Tier</p>
                <p className={`text-base font-black tracking-wide ${plan === 'ENTERPRISE' ? 'text-indigo-600' : plan === 'PRO' ? 'text-cyan-600' : 'text-slate-600'}`}>
                  {plan} LIMIT
                </p>
              </div>
              <Link href="/billing"
                className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm">
                <Zap size={11} /> Upgrade
              </Link>
            </div>
          </div>

          {/* Real-time Performance Sidebar */}
          {summary && (
            <div className="glass-card bg-white border-slate-200 shadow-md p-5 space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Response Performance</span>
                <p className="text-[11px] text-slate-400 font-bold mt-0.5">Engagement index metrics</p>
              </div>

              <div className="space-y-3 pt-1">
                {[
                  { label: 'Read Success Rate',   value: `${summary.read_rate}%`,     icon: BookOpen,      color: 'text-cyan-600 bg-cyan-50' },
                  { label: 'New CRM Leads',       value: summary.new_contacts_today,  icon: Users,         color: 'text-violet-600 bg-violet-50' },
                  { label: 'Conversion Index',    value: summary.converted_leads,     icon: TrendingUp,    color: 'text-emerald-600 bg-emerald-50'   },
                  { label: 'Failed Deliveries',   value: summary.messages_failed,     icon: MessageSquare, color: 'text-rose-500 bg-rose-50'    },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                        <Icon size={12} />
                      </div>
                      <span className="text-xs text-slate-500 font-bold truncate">{label}</span>
                    </div>
                    <span className="text-xs font-black text-slate-800 shrink-0">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Role Agent Notification */}
          {userRole === 'agent' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-705 rounded-xl p-4 text-xs font-semibold leading-normal">
              ℹ️ You are accessing this panel as an agent. Contact your system admin to receive assigned broadcast campaigns or update flows.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
