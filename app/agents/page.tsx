'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Search, UserCog, SlidersHorizontal, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { encryptId } from '@/lib/idCrypto';

interface Agent {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'manager' | 'agent';
  workspace_role: 'manager' | 'agent';
  is_active: number;
  created_at: string;
}

interface Campaign {
  id: number;
  name: string;
  status: string;
  campaign_type: string;
  template_name?: string;
}

const ROLE_BADGE: Record<string, string> = {
  manager: 'bg-blue-100 text-blue-700',
  agent:   'bg-green-100 text-green-700',
};

const STATUS_DOT: Record<string, string> = {
  draft:     'bg-gray-400',
  scheduled: 'bg-blue-400',
  running:   'bg-yellow-400',
  completed: 'bg-green-500',
  failed:    'bg-red-400',
};

// ── Assign Campaigns Modal ────────────────────────────────────
function AssignCampaignsModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [allCampaigns, setAllCampaigns]     = useState<Campaign[]>([]);
  const [assignedIds, setAssignedIds]       = useState<number[]>([]);
  const [loading, setLoading]               = useState(true);
  const [toggling, setToggling]             = useState<number | null>(null);
  const [search, setSearch]                 = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('/api/campaigns', { headers }).then((r) => r.json()),
      fetch(`/api/agents/${encryptId(agent.id)}/campaigns`, { headers }).then((r) => r.json()),
    ]).then(([allRes, assignedRes]) => {
      setAllCampaigns(allRes.data || []);
      setAssignedIds((assignedRes.data || []).map((c: Campaign) => c.id));
      setLoading(false);
    });
  }, [agent.id, token]);

  async function toggle(campaign: Campaign) {
    const isAssigned = assignedIds.includes(campaign.id);
    setToggling(campaign.id);
    try {
      const res = await fetch(`/api/campaigns/${encryptId(campaign.id)}/assign`, {
        method: isAssigned ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agent_id: agent.id }),
      });
      if (res.ok) {
        setAssignedIds((prev) =>
          isAssigned ? prev.filter((id) => id !== campaign.id) : [...prev, campaign.id]
        );
        toast.success(isAssigned ? 'Campaign removed' : 'Campaign assigned!');
      } else {
        toast.error('Failed');
      }
    } finally {
      setToggling(null);
    }
  }

  const filtered = allCampaigns.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg shadow-2xl flex flex-col max-h-[92vh] rounded-t-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 border-b border-gray-200 flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-900">Assign Campaigns</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-5 h-5 rounded-full bg-whatsapp-teal text-white text-[10px] font-bold flex items-center justify-center">
                {agent.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-500">{agent.name}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[agent.workspace_role]}`}>
                {agent.workspace_role}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-1">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 sm:px-6 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 focus-within:text-emerald-500 transition-colors" />
            <input
              type="text" placeholder="Search campaigns…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="search-input !pl-10"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-gray-100">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Campaign list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 sm:px-6 space-y-2">
          {loading ? (
            <p className="text-center text-gray-400 py-10 text-sm">Loading campaigns…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">No campaigns found</p>
          ) : (
            filtered.map((campaign) => {
              const isAssigned = assignedIds.includes(campaign.id);
              const isToggling = toggling === campaign.id;
              return (
                <button
                  key={campaign.id}
                  onClick={() => !isToggling && toggle(campaign)}
                  disabled={isToggling}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                    ${isAssigned
                      ? 'border-whatsapp-green bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    } disabled:opacity-60`}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                    isAssigned ? 'bg-whatsapp-green border-whatsapp-green' : 'border-gray-300'
                  }`}>
                    {isAssigned && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>

                  {/* Campaign info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{campaign.name}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {campaign.template_name || 'No template'} • {campaign.campaign_type}
                    </p>
                  </div>

                  {/* Status dot */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${STATUS_DOT[campaign.status] || 'bg-gray-400'}`} />
                    <span className="text-xs text-gray-400 capitalize">{campaign.status}</span>
                  </div>

                  {/* Loading spinner */}
                  {isToggling && (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-whatsapp-green rounded-full animate-spin flex-shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 sm:px-6 border-t border-gray-150 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <span className="text-xs text-gray-450 font-medium">
            {assignedIds.length} campaign{assignedIds.length !== 1 ? 's' : ''} assigned
          </span>
          <button onClick={onClose} className="btn-primary text-sm px-6">Done</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AgentsPage() {
  const [agents, setAgents]             = useState<Agent[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [assignAgent, setAssignAgent]   = useState<Agent | null>(null);
  const [saving, setSaving]             = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    role: 'agent' as 'manager' | 'agent',
    password: '',
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/agents', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setAgents(data.data || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  async function createAgent(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to create agent'); return; }
      toast.success('Agent created successfully');
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', role: 'agent', password: '' });
      fetchAgents();
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(agent: Agent) {
    const res = await fetch(`/api/agents/${encryptId(agent.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: agent.is_active ? 0 : 1 }),
    });
    if (res.ok) {
      toast.success(agent.is_active ? 'Agent deactivated' : 'Agent activated');
      fetchAgents();
    }
  }

  async function deleteAgent(agent: Agent) {
    if (!confirm(`Remove ${agent.name} from workspace?`)) return;
    const res = await fetch(`/api/agents/${encryptId(agent.id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { toast.success('Agent removed'); fetchAgents(); }
    else toast.error('Failed to remove agent');
  }

  async function changeRole(agent: Agent, role: 'manager' | 'agent') {
    const res = await fetch(`/api/agents/${encryptId(agent.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    });
    if (res.ok) { toast.success('Role updated'); fetchAgents(); }
  }

  const filtered = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Agents</h1>
            {!loading && agents.length > 0 && (
              <span className="bg-slate-100 text-slate-650 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                {agents.length}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage team members and their access levels</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm px-4 py-2.5 rounded-xl font-bold transition-all shadow-[0_4px_12px_rgba(22,163,74,0.15)] hover:shadow-[0_4px_20px_rgba(22,163,74,0.3)] active:translate-y-0.5 shrink-0"
        >
          <Plus size={16} /> Add Agent
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 focus-within:text-emerald-500 transition-colors" />
        <input
          type="text" placeholder="Search by name or email…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="search-input !pl-10"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-gray-100">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="md:bg-white md:rounded-xl md:border md:border-gray-200 overflow-hidden md:shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <UserCog size={40} className="opacity-30" />
            <p className="text-sm">No agents yet. Add your first agent.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card List (shown on mobile, hidden on desktop/tablet) */}
            <div className="block md:hidden space-y-4">
              {filtered.map((agent) => (
                <div key={agent.id} className="glass-card hover:bg-white/95 hover:border-slate-300/80 bg-white/80 p-5 space-y-4 border border-slate-200/60 shadow-sm relative overflow-hidden transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center text-white font-bold text-base shadow-[0_2px_8px_rgba(22,163,74,0.15)]">
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-800 text-sm leading-snug">{agent.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{agent.email}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleStatus(agent)} className="focus:outline-none select-none transition-transform duration-205 active:scale-95">
                      {agent.is_active ? (
                        <ToggleRight size={30} className="text-green-600 transition-colors duration-200" />
                      ) : (
                        <ToggleLeft size={30} className="text-slate-350 transition-colors duration-200" />
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">WhatsApp Phone</span>
                      <span className="font-semibold text-slate-700">{agent.phone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Role / Access</span>
                      <div className="relative inline-block w-full">
                        <select
                          value={agent.workspace_role}
                          onChange={(e) => changeRole(agent, e.target.value as 'manager' | 'agent')}
                          className={`text-xs font-bold px-3 py-1 rounded-xl border border-slate-200 cursor-pointer bg-white w-full focus:outline-none focus:ring-1 focus:ring-green-500/20 ${ROLE_BADGE[agent.workspace_role]}`}
                        >
                          <option value="agent" className="bg-white text-slate-700">Agent</option>
                          <option value="manager" className="bg-white text-slate-700">Manager</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      onClick={() => setAssignAgent(agent)}
                      title="Assign campaigns"
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-bold bg-white hover:bg-slate-50 text-slate-650 px-3 py-2.5 rounded-xl border border-slate-200 transition-all duration-200 shadow-sm active:translate-y-0.5"
                    >
                      <SlidersHorizontal size={13} className="text-slate-400" /> Assign Campaigns
                    </button>
                    <button
                      onClick={() => deleteAgent(agent)}
                      title="Remove agent"
                      className="flex items-center justify-center gap-2 text-xs font-bold bg-rose-50/50 hover:bg-rose-100/70 text-rose-600 px-3.5 py-2.5 rounded-xl border border-rose-200/50 transition-all duration-200 shadow-sm active:translate-y-0.5"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Agent</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-whatsapp-teal flex items-center justify-center text-white font-semibold text-sm">
                            {agent.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{agent.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{agent.email}</td>
                      <td className="px-4 py-3 text-gray-600">{agent.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <select
                          value={agent.workspace_role}
                          onChange={(e) => changeRole(agent, e.target.value as 'manager' | 'agent')}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${ROLE_BADGE[agent.workspace_role]}`}
                        >
                          <option value="agent">Agent</option>
                          <option value="manager">Manager</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleStatus(agent)}>
                          {agent.is_active ? (
                            <ToggleRight size={22} className="text-green-500" />
                          ) : (
                            <ToggleLeft size={22} className="text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Filter / Assign Campaigns icon */}
                          <button
                            onClick={() => setAssignAgent(agent)}
                            title="Assign campaigns"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <SlidersHorizontal size={15} />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => deleteAgent(agent)}
                            title="Remove agent"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Create Agent Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <form onSubmit={createAgent} className="bg-white w-full sm:rounded-2xl sm:max-w-md shadow-2xl flex flex-col max-h-[92vh] rounded-t-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Create Agent</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Agent&apos;s Name</label>
                <input
                  type="text" required placeholder="Full name"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Agent&apos;s Email</label>
                <input
                  type="email" required placeholder="agent@company.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">WhatsApp Number (optional)</label>
                <div className="flex gap-2">
                  <span className="border border-slate-200 rounded-xl px-3.5 flex items-center text-slate-500 bg-slate-50 text-sm font-semibold">+91</span>
                  <input
                    type="tel" placeholder="Agent's WhatsApp Number"
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input flex-1 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as 'manager' | 'agent' })}
                  className="input text-sm"
                >
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Login Details</p>
                <input
                  type="password" required placeholder="Password"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input text-sm"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-150 bg-slate-50/50 flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors bg-white font-sans"
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold disabled:opacity-60 transition-colors shadow-sm font-sans">
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Campaigns Modal */}
      {assignAgent && (
        <AssignCampaignsModal
          agent={assignAgent}
          onClose={() => setAssignAgent(null)}
        />
      )}
    </div>
  );
}
