'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/hooks/useApi';
import { Plus, Play, Radio, Zap, ChevronRight, Trash2, UserPlus, X, Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Eye, Send, CheckCircle2, AlertCircle, Phone, Sparkles, Users, ChevronDown, Search, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Campaign, Template, Contact, User } from '@/types';
import { encryptId } from '@/lib/idCrypto';

const STATUS_COLORS: Record<string, string> = {
  draft:      'bg-gray-100 text-gray-600',
  scheduled:  'bg-blue-100 text-blue-700',
  running:    'bg-yellow-100 text-yellow-700',
  completed:  'bg-green-100 text-green-700',
  failed:     'bg-red-100 text-red-700',
};

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; desc: string }> = {
  broadcast:     { label: 'Broadcast',     color: 'text-purple-700', bg: 'bg-purple-100', icon: <Radio size={12} />,       desc: 'Bulk send to a list of contacts' },
  api:           { label: 'API',           color: 'text-blue-700',   bg: 'bg-blue-100',   icon: <Zap size={12} />,         desc: 'Triggered via external API calls' },
};

const ALL_TYPES = ['all', 'broadcast', 'api'] as const;
type FilterType = typeof ALL_TYPES[number];

export default function CampaignsPage() {
  const router                              = useRouter();
  const [campaigns, setCampaigns]           = useState<Campaign[]>([]);
  const [loading, setLoading]               = useState(true);
  const [showModal, setShowModal]           = useState(false);
  const [filterType, setFilterType]         = useState<FilterType>('all');
  const [deletingId, setDeletingId]         = useState<number | null>(null);
  const [assignCampaign, setAssignCampaign] = useState<Campaign | null>(null);
  const [userRole, setUserRole]             = useState('admin');
  const [dateFilter, setDateFilter]         = useState('');

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || 'admin');
  }, []);

  function load(date?: string) {
    setLoading(true);
    const qs = date ? `?date=${date}` : '';
    apiFetch(`/api/campaigns${qs}`).then((r) => setCampaigns(r.data || [])).finally(() => setLoading(false));
  }

  useEffect(() => { load(dateFilter); }, [dateFilter]);

  async function deleteCampaign(id: number, name: string) {
    if (!confirm(`Delete campaign "${name}"? Ye action undo nahi ho sakta.`)) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`/api/campaigns/${encryptId(id)}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Delete failed', { duration: 6000 }); return; }
      toast.success('Campaign deleted');
      load(dateFilter);
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  async function launch(id: number) {
    try {
      const r = await apiFetch(`/api/campaigns/${encryptId(id)}/launch`, { method: 'POST' });
      toast.success(r.data?.message || 'Campaign launched!');
      load(dateFilter);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Launch failed');
    }
  }

  // Use accurate counts from campaign_contacts (cc_* fields); fall back to campaigns table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyC = (c: Campaign) => c as any;
  function ccSent(c: Campaign)      { return Number(anyC(c).cc_sent      ?? c.sent_count      ?? 0); }
  function ccDelivered(c: Campaign) { return Number(anyC(c).cc_delivered ?? c.delivered_count ?? 0); }
  function ccRead(c: Campaign)      { return Number(anyC(c).cc_read      ?? c.read_count      ?? 0); }
  function ccFailed(c: Campaign)    { return Number(anyC(c).cc_failed    ?? c.failed_count    ?? 0); }

  function deliveryRate(c: Campaign) {
    const total = c.total_contacts;
    if (!total) return '—';
    return `${Math.round((ccDelivered(c) / total) * 100)}%`;
  }
  function readRate(c: Campaign) {
    const total = c.total_contacts;
    if (!total) return '—';
    return `${Math.round((ccRead(c) / total) * 100)}%`;
  }

  const filtered = filterType === 'all'
    ? campaigns
    : campaigns.filter((c) => (c as Campaign & { campaign_type?: string }).campaign_type === filterType);

  // Count per type
  const counts = ALL_TYPES.reduce<Record<string, number>>((acc, t) => {
    acc[t] = t === 'all' ? campaigns.length : campaigns.filter((c) => (c as Campaign & { campaign_type?: string }).campaign_type === t).length;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        {userRole !== 'agent' && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> New Campaign
          </button>
        )}
      </div>

      {/* Type filter tabs + Date filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {ALL_TYPES.map((t) => {
            const cfg = t === 'all' ? null : TYPE_CONFIG[t];
            const isActive = filterType === t;
            return (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {cfg && <span className={cfg.color}>{cfg.icon}</span>}
                <span className="capitalize">{t === 'all' ? 'All' : cfg?.label}</span>
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                  isActive ? 'bg-gray-100 text-gray-600' : 'bg-white text-gray-400'
                }`}>{counts[t]}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 font-medium">
            {dateFilter ? `Stats for ${dateFilter}` : 'Stats: All time'}
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-gray-400 hover:text-red-500 px-1.5"
              title="Clear date filter"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Campaign cards */}
      {loading ? (
        <p className="text-gray-400 text-center py-10">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">📣</div>
          <p className="text-gray-600 font-medium">No {filterType === 'all' ? '' : filterType + ' '}campaigns yet</p>
          <p className="text-gray-400 text-sm mt-1">
            {filterType === 'all'
              ? 'Create a campaign to send bulk WhatsApp messages'
              : `No ${TYPE_CONFIG[filterType]?.label} campaigns found`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((c) => {
            const cType = (c as Campaign & { campaign_type?: string }).campaign_type || 'broadcast';
            const typeCfg = TYPE_CONFIG[cType] || TYPE_CONFIG.broadcast;
            return (
              <div key={c.id} className="card cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/campaigns/${encryptId(c.id)}`)}>
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{c.name}</h3>
                      {/* Campaign type badge */}
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${typeCfg.bg} ${typeCfg.color}`}>
                        {typeCfg.icon}
                        {typeCfg.label}
                      </span>
                      {/* Status badge */}
                      <span className={`badge ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Template: {c.template_name || c.template_id}</p>
                    {c.scheduled_at && (
                      <p className="text-sm text-gray-400 mt-0.5">
                        Scheduled: {new Date(c.scheduled_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Stats — counts from campaign_contacts (accurate) */}
                  <div className="grid grid-cols-5 gap-1 md:flex md:gap-6 text-sm w-full md:w-auto mt-3 md:mt-0">
                    {[
                      { label: 'Total',     value: c.total_contacts,  color: 'text-gray-900'   },
                      { label: 'Sent',      value: ccSent(c),         color: 'text-blue-600'   },
                      { label: 'Delivered', value: deliveryRate(c),   color: 'text-green-600'  },
                      { label: 'Read',      value: readRate(c),       color: 'text-purple-600' },
                      { label: 'Failed',    value: ccFailed(c),       color: 'text-red-600'    },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-center min-w-0">
                        <p className={`font-semibold ${color} truncate text-xs sm:text-sm`}>{value}</p>
                        <p className="text-gray-400 text-[10px] sm:text-xs truncate">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {cType === 'api' ? (
                      <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 flex items-center gap-1">
                        <Zap size={12} /> Call via API
                      </span>
                    ) : (c.status === 'draft' || c.status === 'scheduled') && (
                      <button onClick={() => launch(c.id)}
                        className="btn-primary flex items-center gap-1 text-sm px-3 py-1.5">
                        <Play size={14} /> Launch
                      </button>
                    )}
                    {/* Assign Agent — admin/manager only */}
                    {['admin','manager'].includes(userRole) && (
                      <button
                        onClick={() => setAssignCampaign(c)}
                        title="Assign to agent"
                        className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <UserPlus size={15} />
                      </button>
                    )}
                    {userRole !== 'agent' && (
                      <button
                        onClick={() => deleteCampaign(c.id, c.name)}
                        disabled={deletingId === c.id || c.status === 'running'}
                        title={c.status === 'running' ? 'Running campaign delete nahi ho sakta' : 'Delete campaign'}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        {deletingId === c.id
                          ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <Trash2 size={15} />}
                      </button>
                    )}
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </div>

                {/* Progress bar for running campaign */}
                {c.status === 'running' && c.total_contacts > 0 && (
                  <div className="mt-4">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full transition-all"
                        style={{ width: `${Math.round(((ccSent(c) + ccFailed(c)) / c.total_contacts) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {ccSent(c) + ccFailed(c)}/{c.total_contacts} processed
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <CampaignWizard onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(dateFilter); }} />
      )}

      {assignCampaign && (
        <AssignAgentModal
          campaign={assignCampaign}
          onClose={() => setAssignCampaign(null)}
        />
      )}
    </div>
  );
}

// ---- Assign Agent Modal ----
function AssignAgentModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const [agents, setAgents]         = useState<User[]>([]);
  const [assigned, setAssigned]     = useState<number[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState<number | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('/api/agents', { headers }).then((r) => r.json()),
      fetch(`/api/campaigns/${encryptId(campaign.id)}/assign`, { headers }).then((r) => r.json()),
    ]).then(([agentsRes, assignedRes]) => {
      setAgents(agentsRes.data || []);
      setAssigned((assignedRes.data || []).map((a: { id: number }) => a.id));
      setLoading(false);
    });
  }, [campaign.id, token]);

  async function toggle(agentId: number, isAssigned: boolean) {
    setSaving(agentId);
    try {
      const res = await fetch(`/api/campaigns/${encryptId(campaign.id)}/assign`, {
        method: isAssigned ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agent_id: agentId }),
      });
      if (res.ok) {
        setAssigned((prev) =>
          isAssigned ? prev.filter((id) => id !== agentId) : [...prev, agentId]
        );
        toast.success(isAssigned ? 'Agent removed' : 'Campaign assigned!');
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Assign Agents</h2>
            <p className="text-xs text-gray-400 mt-0.5">{campaign.name}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="p-4">
          {loading ? (
            <p className="text-center text-gray-400 py-8 text-sm">Loading agents…</p>
          ) : agents.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">
              No agents found. Create agents from the Agents page first.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {agents.map((agent) => {
                const isAssigned = assigned.includes(agent.id);
                const isSaving   = saving === agent.id;
                return (
                  <div key={agent.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                      isAssigned ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className="w-9 h-9 rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{agent.name}</p>
                      <p className="text-xs text-gray-400 truncate">{agent.email}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      agent.role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>{agent.role}</span>
                    <button
                      onClick={() => toggle(agent.id, isAssigned)}
                      disabled={isSaving}
                      className={`ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isAssigned
                          ? 'bg-red-50 text-red-500 hover:bg-red-100'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      } disabled:opacity-50`}
                    >
                      {isSaving ? '…' : isAssigned ? 'Remove' : 'Assign'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 pb-4">
          <button onClick={onClose} className="w-full btn-secondary text-sm">Done</button>
        </div>
      </div>
    </div>
  );
}

// ╔═══════════════════════════════════════════════════════════════╗
// ║  CAMPAIGN CREATION WIZARD — AiSensy-Style 3-Step Flow       ║
// ╚═══════════════════════════════════════════════════════════════╝

interface CsvRow {
  [key: string]: string;
}

function CampaignWizard({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [step, setStep]             = useState(1);
  const [templates, setTemplates]   = useState<Template[]>([]);
  const [contacts, setContacts]     = useState<Contact[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Step 1: Campaign info
  const [campaignName, setCampaignName]     = useState('');
  const [campaignType, setCampaignType]     = useState<'broadcast' | 'api'>('broadcast');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Step 2: Audience
  const [audienceMode, setAudienceMode]   = useState<'csv' | 'contacts'>('csv');
  const [csvFile, setCsvFile]             = useState<File | null>(null);
  const [csvData, setCsvData]             = useState<CsvRow[]>([]);
  const [csvColumns, setCsvColumns]       = useState<string[]>([]);
  const [csvError, setCsvError]           = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [varMapping, setVarMapping]       = useState<Record<string, string>>({});
  const [phoneColumn, setPhoneColumn]     = useState('');
  const [scheduledAt, setScheduledAt]     = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Media Header values (only for broadcast campaigns with media headers)
  const [headerMediaType, setHeaderMediaType] = useState<'url' | 'id'>('url');
  const [headerMediaValue, setHeaderMediaValue] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  useEffect(() => {
    setHeaderMediaType('url');
    setHeaderMediaValue('');
    setUploadedFileName('');
  }, [selectedTemplate]);

  // Template Search dropdown states
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Step 3: Test & Launch
  const [testPhone, setTestPhone]       = useState('');
  const [testSending, setTestSending]   = useState(false);
  const [testResult, setTestResult]     = useState<{ success: boolean; message: string } | null>(null);
  const [createdId, setCreatedId]       = useState<number | null>(null);
  const [saving, setSaving]             = useState(false);
  const [launching, setLaunching]       = useState(false);

  // For API campaign: show endpoint after creation
  const [apiCreatedId, setApiCreatedId] = useState<number | null>(null);

  const isApi = campaignType === 'api';

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(templateSearch.toLowerCase())
  );

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      apiFetch('/api/templates').then((r) => r.data?.filter((t: Template) => t.status === 'APPROVED') || []),
      apiFetch('/api/contacts?limit=500').then((r) => r.data?.data || []),
    ]).then(([tmpls, cts]) => {
      setTemplates(tmpls);
      setContacts(cts);
      setLoadingData(false);
    });
  }, []);

  // Extract template variables ({{1}}, {{2}}, etc.)
  const templateVars = selectedTemplate?.body_text
    ? (selectedTemplate.body_text.match(/\{\{(\d+)\}\}/g) || []).map((v) => v.replace(/[{}]/g, ''))
    : [];

  // Parse CSV file
  const handleCsvUpload = useCallback(async (file: File) => {
    setCsvFile(file);
    setCsvError('');
    setCsvData([]);
    setCsvColumns([]);
    setPhoneColumn('');

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        setCsvError('CSV file must have headers and at least 1 data row');
        return;
      }

      // Parse header
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());

      // Auto-detect the phone column: exact name first, then fuzzy match
      const detectedPhone =
        headers.find((h) => ['phone', 'mobile', 'number', 'whatsapp', 'msisdn', 'contact'].includes(h)) ||
        headers.find((h) => /(phone|mobile|whats|msisdn|^number$|contact\s*no)/.test(h)) ||
        '';

      // Parse rows (limit to 10000) — keep ALL columns so any can be mapped
      const rows: CsvRow[] = [];
      const maxRows = Math.min(lines.length, 10001); // +1 for header
      for (let i = 1; i < maxRows; i++) {
        const vals = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row: CsvRow = {};
        headers.forEach((h, idx) => {
          row[h] = vals[idx] || '';
        });
        if (detectedPhone) row.phone = row[detectedPhone];
        rows.push(row);
      }

      setCsvColumns(headers);
      setCsvData(rows);
      setPhoneColumn(detectedPhone);

      // Auto-map each template variable to a likely column (never the phone column)
      if (templateVars.length > 0) {
        const used = new Set<string>([detectedPhone, 'phone']);
        const autoMap: Record<string, string> = {};
        templateVars.forEach((v) => {
          const guess = headers.find(
            (h) => !used.has(h) && /(name|first|last|city|email|order|amount|date|id|pincode|product)/.test(h)
          );
          if (guess) { autoMap[v] = guess; used.add(guess); }
        });
        setVarMapping(autoMap);
      }
    } catch {
      setCsvError('Failed to parse CSV file');
    }
  }, [templateVars.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-map the phone value across all rows when the phone column changes
  function changePhoneColumn(col: string) {
    setPhoneColumn(col);
    setCsvData((prev) => prev.map((r) => ({ ...r, phone: col ? (r[col] || '') : '' })));
  }

  function toggleContact(id: number) {
    setSelectedContactIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  // Create campaign
  async function createCampaign(): Promise<number | null> {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: campaignName,
        template_id: selectedTemplate!.id,
        campaign_type: campaignType,
        template_vars: {
          ...varMapping,
          __header_media_type: headerMediaType,
          __header_media_value: headerMediaValue,
        },
      };

      if (scheduledAt) body.scheduled_at = scheduledAt;

      if (isApi) {
        body.contact_ids = [];
      } else if (audienceMode === 'csv' && csvData.length > 0) {
        body.csv_contacts = csvData
          .filter((row) => (row.phone || '').trim())
          .map((row) => ({
            name: row.name || null,
            phone: row.phone || '',
            email: row.email || null,
            city: row.city || null,
            source: row.source || 'csv_campaign',
          }));
      } else {
        body.contact_ids = selectedContactIds;
      }

      const r = await apiFetch('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const id = r.data?.id;
      setCreatedId(id);
      return id;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create campaign');
      return null;
    } finally {
      setSaving(false);
    }
  }

  // Test send
  async function sendTest() {
    if (!testPhone.trim()) { toast.error('Enter a phone number'); return; }

    // Create campaign first if not created
    let campId = createdId;
    if (!campId) {
      campId = await createCampaign();
      if (!campId) return;
    }

    setTestSending(true);
    setTestResult(null);
    try {
      // Build test variables from mapping
      const testVars: Record<string, string> = {};
      for (const [varIdx, mapped] of Object.entries(varMapping)) {
        if (varIdx.startsWith('__')) continue;
        if (mapped.startsWith('manual::')) {
          testVars[varIdx] = mapped.slice(8);                 // fixed manual value
        } else if (csvData.length > 0 && csvData[0][mapped]) {
          testVars[varIdx] = csvData[0][mapped];              // first CSV row value
        } else {
          testVars[varIdx] = `{{${varIdx}}}`;
        }
      }

      const r = await apiFetch(`/api/campaigns/${encryptId(campId)}/test`, {
        method: 'POST',
        body: JSON.stringify({ phone: testPhone, variables: testVars }),
      });
      setTestResult({ success: true, message: r.data?.message || 'Test message sent!' });
    } catch (err) {
      setTestResult({ success: false, message: err instanceof Error ? err.message : 'Failed' });
    } finally {
      setTestSending(false);
    }
  }

  // Launch campaign
  async function handleLaunch() {
    let campId = createdId;
    if (!campId) {
      campId = await createCampaign();
      if (!campId) return;
    }

    setLaunching(true);
    try {
      const r = await apiFetch(`/api/campaigns/${encryptId(campId)}/launch`, { method: 'POST' });
      toast.success(r.data?.message || 'Campaign launched!');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Launch failed');
    } finally {
      setLaunching(false);
    }
  }

  // Save as draft
  async function handleSaveDraft() {
    const id = await createCampaign();
    if (id) {
      toast.success('Campaign saved as draft!');
      onSaved();
    }
  }

  // API campaign creation
  async function handleApiCreate() {
    const id = await createCampaign();
    if (id) setApiCreatedId(id);
  }

  // Audience count
  // For CSV, only count rows that have a phone in the selected column
  const csvValidCount = csvData.filter((r) => (r.phone || '').trim()).length;
  const audienceCount = audienceMode === 'csv' ? csvValidCount : selectedContactIds.length;

  // Step validation
  const hasMediaHeader = selectedTemplate && ['IMAGE', 'DOCUMENT', 'VIDEO'].includes(selectedTemplate.header_type);
  const isMediaHeaderFilled = !hasMediaHeader || headerMediaValue.trim();

  // CSV mode needs a phone column chosen; all template variables must be mapped
  const phoneOk   = audienceMode !== 'csv' || !!phoneColumn;
  const varsMapped = templateVars.every((v) => {
    const m = varMapping[v];
    if (!m) return false;
    if (m.startsWith('manual::')) return m.slice(8).trim().length > 0;
    return true;
  });
  const canGoStep2 = campaignName.trim() && selectedTemplate;
  const canGoStep3 = (isApi || audienceCount > 0) && isMediaHeaderFilled && phoneOk && varsMapped;

  // Render template preview bubble
  function TemplatePreview({ template, mediaType, mediaValue }: { template: Template; mediaType?: string; mediaValue?: string }) {
    let body = template.body_text || '';
    // Replace vars with highlights
    body = body.replace(/\{\{(\d+)\}\}/g, '<span class="bg-yellow-200 text-yellow-800 px-1 rounded font-mono text-xs">{{$1}}</span>');

    // Parse buttons
    let buttons: { type: string; text: string }[] = [];
    try {
      const parsed = typeof template.buttons === 'string' ? JSON.parse(template.buttons) : template.buttons;
      if (Array.isArray(parsed)) buttons = parsed;
    } catch { /* empty */ }

    return (
      <div className="bg-[#e7fed6] rounded-xl rounded-tl-none p-3 max-w-[280px] shadow-sm border border-green-200">
        {template.header_type === 'TEXT' && template.header_content && (
          <p className="font-bold text-sm text-gray-900 mb-1">{template.header_content}</p>
        )}
        {template.header_type === 'IMAGE' && (
          mediaType === 'url' && mediaValue ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaValue} alt="Header image" className="w-full h-32 object-cover rounded-lg mb-2" />
          ) : (
            <div className="w-full h-32 bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-gray-400 text-xs">
              📷 Image Header
            </div>
          )
        )}
        {template.header_type === 'VIDEO' && (
          <div className="w-full h-32 bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-gray-400 text-xs text-center px-2">
            🎥 Video Header {mediaType === 'url' && mediaValue && '(URL Provided)'}
          </div>
        )}
        {template.header_type === 'DOCUMENT' && (
          <div className="w-full h-32 bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-gray-400 text-xs text-center px-2">
            📄 Document Header {mediaType === 'url' && mediaValue && '(URL Provided)'}
          </div>
        )}
        <p className="text-sm text-gray-800 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: body }} />
        {template.footer_text && (
          <p className="text-xs text-gray-500 mt-2">{template.footer_text}</p>
        )}
        {buttons.length > 0 && (
          <div className="mt-2 border-t border-green-300 pt-2 space-y-1">
            {buttons.map((btn, i) => (
              <div key={i} className="text-center text-sm text-blue-600 font-medium py-1 hover:bg-green-100 rounded cursor-default">
                {btn.text}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── API Campaign created → show endpoint ──
  if (apiCreatedId) {
    const encryptedApiId = encryptId(apiCreatedId);
    const apiEndpoint = typeof window !== 'undefined'
      ? `${window.location.origin}/api/campaigns/${encryptedApiId}/send`
      : `/api/campaigns/${encryptedApiId}/send`;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="p-6 border-b border-gray-200 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <h2 className="font-bold text-lg">API Campaign Created!</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Use this endpoint to send messages from your backend/system:
            </p>

            <div className="bg-gray-900 rounded-lg p-4 text-xs font-mono text-green-400 space-y-1 overflow-x-auto">
              <p className="text-gray-400">POST {apiEndpoint}</p>
              <p className="text-gray-400">Authorization: Bearer YOUR_JWT_TOKEN</p>
              <p className="text-gray-400">Content-Type: application/json</p>
              <br />
              <p>{'{'}</p>
              <p>&nbsp;&nbsp;&quot;phone&quot;: &quot;919876543210&quot;,</p>
              <p>&nbsp;&nbsp;&quot;variables&quot;: {'{'}&quot;1&quot;: &quot;John&quot;, &quot;2&quot;: &quot;Order#123&quot;{'}'}</p>
              <p>{'}'}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-1">
              <p><strong>phone</strong> — recipient number with country code (no +)</p>
              <p><strong>variables</strong> — template variables like {`{{1}}`}, {`{{2}}`}</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { navigator.clipboard.writeText(`POST ${apiEndpoint}`); toast.success('Copied!'); }}
                className="btn-secondary flex-1 text-sm">Copy URL</button>
              <button onClick={onSaved} className="btn-primary flex-1 text-sm">Done</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg text-gray-900">New Campaign</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isApi ? 'API Campaign' : `Step ${step} of 3`}
            </p>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        {/* Step Indicator (Broadcast only) */}
        {!isApi && (
          <div className="px-6 pt-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              {[
                { num: 1, label: 'Select Template', icon: <FileSpreadsheet size={14} /> },
                { num: 2, label: 'Audience & Variables', icon: <Users size={14} /> },
                { num: 3, label: 'Test & Launch', icon: <Send size={14} /> },
              ].map(({ num, label, icon }, idx) => (
                <div key={num} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full transition-all ${
                    step === num
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : step > num
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step > num ? <CheckCircle2 size={14} /> : icon}
                    <span className="truncate">{label}</span>
                  </div>
                  {idx < 2 && <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ════════════════════════════════════════════════════ */}
          {/* STEP 1: Campaign Info + Template Selection           */}
          {/* ════════════════════════════════════════════════════ */}
          {step === 1 && (
            <>
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Campaign Name *</label>
                <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)}
                  className="input" placeholder="e.g. Diwali Sale 2024" required />
              </div>

              {/* Campaign Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <label key={key} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      campaignType === key
                        ? 'border-green-600 bg-green-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input type="radio" name="campaign_type" value={key}
                        checked={campaignType === key}
                        onChange={() => setCampaignType(key as 'broadcast' | 'api')}
                        className="mt-0.5 accent-green-600" />
                      <div>
                        <div className={`flex items-center gap-1.5 text-sm font-semibold ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{cfg.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Template * <span className="font-normal text-gray-400">(Approved only)</span></label>
                {loadingData ? (
                  <div className="text-center py-6 text-gray-400 text-sm">Loading templates...</div>
                ) : templates.length === 0 ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
                    No approved templates found. Create and get a template approved first.
                  </div>
                ) : (
                  <div className="relative" ref={dropdownRef}>
                    {/* Trigger button */}
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-left text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 flex justify-between items-center shadow-sm"
                    >
                      <span className={selectedTemplate ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                        {selectedTemplate ? `${selectedTemplate.name} (${selectedTemplate.language})` : 'Select template'}
                      </span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown panel */}
                    {dropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 space-y-2.5 max-h-72 flex flex-col">
                        {/* Search Input */}
                        <div className="relative flex-shrink-0">
                          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                          <input
                            type="text"
                            value={templateSearch}
                            onChange={(e) => setTemplateSearch(e.target.value)}
                            placeholder="Search templates..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-200"
                          />
                          {templateSearch && (
                            <button
                              type="button"
                              onClick={() => setTemplateSearch('')}
                              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>

                        {/* Options list */}
                        <div className="overflow-y-auto flex-1 divide-y divide-slate-100 max-h-48">
                          {filteredTemplates.length === 0 ? (
                            <div className="text-center py-4 text-xs text-slate-400">No templates found</div>
                          ) : (
                            filteredTemplates.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  setSelectedTemplate(t);
                                  setVarMapping({});
                                  setDropdownOpen(false);
                                  setTemplateSearch('');
                                }}
                                className={`w-full text-left px-3 py-2.5 text-xs rounded-lg transition-colors hover:bg-slate-50 flex items-center justify-between ${
                                  selectedTemplate?.id === t.id ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-700'
                                }`}
                              >
                                <span>{t.name} ({t.language})</span>
                                {selectedTemplate?.id === t.id && <Check size={12} className="text-emerald-600" />}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Template Preview */}
              {selectedTemplate && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Template Preview</label>
                  <div className="bg-[#ece5dd] rounded-xl p-4 flex justify-start">
                    <TemplatePreview template={selectedTemplate} mediaType={headerMediaType} mediaValue={headerMediaValue} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ════════════════════════════════════════════════════ */}
          {/* STEP 2: Audience & Variable Mapping                  */}
          {/* ════════════════════════════════════════════════════ */}
          {step === 2 && !isApi && (
            <>
              {/* Audience Mode Toggle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Audience</label>
                <div className="flex gap-2">
                  <button onClick={() => setAudienceMode('csv')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      audienceMode === 'csv'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    <Upload size={14} /> Upload CSV
                  </button>
                  <button onClick={() => setAudienceMode('contacts')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      audienceMode === 'contacts'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    <Users size={14} /> Existing Contacts
                  </button>
                </div>
              </div>

              {/* CSV Upload */}
              {audienceMode === 'csv' && (
                <div>
                  <input type="file" accept=".csv" ref={fileInputRef} className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) handleCsvUpload(e.target.files[0]); }} />

                  {!csvFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-all group">
                      <div className="w-14 h-14 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                        <FileSpreadsheet size={24} className="text-green-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">Click to upload CSV file</p>
                      <p className="text-xs text-gray-400 mt-1">CSV must have a &quot;phone&quot; column. Max 10,000 contacts.</p>
                      <p className="text-xs text-gray-400 mt-0.5">Supported columns: name, phone, email, city, source</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* File info */}
                      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                          <FileSpreadsheet size={18} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{csvFile.name}</p>
                          <p className="text-xs text-green-600">{csvData.length} contacts found • {csvColumns.length} columns</p>
                        </div>
                        <button onClick={() => { setCsvFile(null); setCsvData([]); setCsvColumns([]); setCsvError(''); }}
                          className="text-gray-400 hover:text-red-500 p-1">
                          <X size={16} />
                        </button>
                      </div>

                      {csvError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 flex items-center gap-2">
                          <AlertCircle size={14} /> {csvError}
                        </div>
                      )}

                      {/* CSV Preview */}
                      {csvData.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1.5">Preview (first 5 rows)</p>
                          <div className="border border-gray-200 rounded-lg overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                  {csvColumns.map((col) => (
                                    <th key={col} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {csvData.slice(0, 5).map((row, i) => (
                                  <tr key={i} className="border-b border-gray-100 last:border-0">
                                    {csvColumns.map((col) => (
                                      <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap">{row[col] || '—'}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Contacts Selector */}
              {audienceMode === 'contacts' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Contacts ({selectedContactIds.length} selected)
                  </label>
                  <div className="border border-gray-200 rounded-xl max-h-52 overflow-y-auto divide-y divide-gray-100">
                    <label className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 cursor-pointer hover:bg-gray-100 sticky top-0">
                      <input type="checkbox"
                        checked={selectedContactIds.length === contacts.length && contacts.length > 0}
                        onChange={(e) => setSelectedContactIds(e.target.checked ? contacts.map((c) => c.id) : [])}
                        className="accent-green-600"
                      />
                      <span className="text-sm font-semibold">Select All ({contacts.length})</span>
                    </label>
                    {contacts.length === 0 && (
                      <p className="text-xs text-gray-400 px-3 py-4 text-center">
                        No contacts yet. Add contacts first from the Contacts page.
                      </p>
                    )}
                    {contacts.map((c) => (
                      <label key={c.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={selectedContactIds.includes(c.id)} onChange={() => toggleContact(c.id)} className="accent-green-600" />
                        <span className="text-sm">{c.name || c.phone} <span className="text-gray-400">+{c.phone}</span></span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Header Input */}
              {selectedTemplate && ['IMAGE', 'DOCUMENT', 'VIDEO'].includes(selectedTemplate.header_type) && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-700">
                      Header {selectedTemplate.header_type} File *
                    </label>
                    {/* Toggle */}
                    <div className="flex bg-gray-200 p-0.5 rounded-lg text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => { setHeaderMediaType('url'); setHeaderMediaValue(''); setUploadedFileName(''); }}
                        className={`px-3 py-1 rounded-md transition-all ${headerMediaType === 'url' ? 'bg-white text-gray-900 shadow' : 'text-gray-500'}`}
                      >
                        Link URL
                      </button>
                      <button
                        type="button"
                        onClick={() => { setHeaderMediaType('id'); setHeaderMediaValue(''); setUploadedFileName(''); }}
                        className={`px-3 py-1 rounded-md transition-all ${headerMediaType === 'id' ? 'bg-white text-gray-900 shadow' : 'text-gray-500'}`}
                      >
                        Upload File
                      </button>
                    </div>
                  </div>

                  {headerMediaType === 'url' ? (
                    <div>
                      <input
                        type="url"
                        value={headerMediaValue}
                        onChange={(e) => setHeaderMediaValue(e.target.value)}
                        placeholder={`https://example.com/file.${selectedTemplate.header_type === 'IMAGE' ? 'jpg' : selectedTemplate.header_type === 'VIDEO' ? 'mp4' : 'pdf'}`}
                        className="input"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        Provide a publicly accessible URL for the media file.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {headerMediaValue ? (
                        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold uppercase">
                            {selectedTemplate.header_type.substring(0, 3)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {uploadedFileName || 'Uploaded file'}
                            </p>
                            <p className="text-xs text-green-600">ID: {headerMediaValue}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setHeaderMediaValue(''); setUploadedFileName(''); }}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-all">
                            {uploadingMedia ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs text-gray-500">Uploading to WhatsApp...</span>
                              </div>
                            ) : (
                              <>
                                <Upload size={20} className="text-gray-400 mb-2" />
                                <span className="text-xs font-semibold text-gray-600">Upload {selectedTemplate.header_type.toLowerCase()}</span>
                                <span className="text-[10px] text-gray-400 mt-0.5">
                                  {selectedTemplate.header_type === 'IMAGE' ? 'JPG, PNG max 5MB' : selectedTemplate.header_type === 'VIDEO' ? 'MP4 max 16MB' : 'PDF max 100MB'}
                                </span>
                              </>
                            )}
                            <input
                              type="file"
                              accept={selectedTemplate.header_type === 'IMAGE' ? 'image/*' : selectedTemplate.header_type === 'VIDEO' ? 'video/*' : '.pdf,application/pdf'}
                              disabled={uploadingMedia}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadingMedia(true);
                                try {
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  const token = localStorage.getItem('token');
                                  const res = await fetch('/api/media', {
                                    method: 'POST',
                                    headers: { Authorization: `Bearer ${token}` },
                                    body: formData
                                  });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data.error || 'Upload failed');
                                  setHeaderMediaValue(data.data.mediaId);
                                  setUploadedFileName(file.name);
                                  toast.success('Media uploaded successfully!');
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : 'Upload failed');
                                } finally {
                                  setUploadingMedia(false);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Phone / WhatsApp number column (CSV) */}
              {audienceMode === 'csv' && csvColumns.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone size={14} className="inline mr-1 text-green-600" />
                    Phone / WhatsApp Number Column
                  </label>
                  <select
                    value={phoneColumn}
                    onChange={(e) => changePhoneColumn(e.target.value)}
                    className="input !py-2"
                  >
                    <option value="">— Select phone column —</option>
                    {csvColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  {phoneColumn ? (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Auto-detected &quot;{phoneColumn}&quot; — {csvData.filter((r) => (r.phone || '').trim()).length} contacts with a number
                    </p>
                  ) : (
                    <p className="text-xs text-red-500 mt-1">Select which column holds the phone number</p>
                  )}
                </div>
              )}

              {/* Variable Mapping */}
              {templateVars.length > 0 && (audienceMode === 'csv' ? csvData.length > 0 : selectedContactIds.length > 0) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Sparkles size={14} className="inline mr-1 text-yellow-500" />
                    Map Template Variables
                  </label>
                  <p className="text-xs text-gray-400 mb-3">Map each variable to a data column, or enter a fixed Manual value used for every contact.</p>
                  <div className="space-y-2">
                    {templateVars.map((varNum) => {
                      const mapped   = varMapping[varNum] || '';
                      const isManual = mapped.startsWith('manual::');
                      const manualVal = isManual ? mapped.slice(8) : '';
                      return (
                      <div key={varNum} className="bg-gray-50 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-lg text-sm font-mono font-bold flex-shrink-0">
                            {`{{${varNum}}}`}
                          </span>
                          <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                          <select
                            value={isManual ? '__manual__' : mapped}
                            onChange={(e) => {
                              const v = e.target.value;
                              setVarMapping((prev) => ({ ...prev, [varNum]: v === '__manual__' ? 'manual::' : v }));
                            }}
                            className="input flex-1 !py-2"
                          >
                            <option value="">— Select column —</option>
                            <option value="__manual__">✎ Manual value</option>
                            {audienceMode === 'csv' ? (
                              csvColumns.map((col) => (
                                <option key={col} value={col}>{col}</option>
                              ))
                            ) : (
                              <>
                                <option value="name">Name</option>
                                <option value="phone">Phone</option>
                              </>
                            )}
                          </select>
                        </div>
                        {isManual && (
                          <input
                            value={manualVal}
                            onChange={(e) => setVarMapping((prev) => ({ ...prev, [varNum]: 'manual::' + e.target.value }))}
                            placeholder={`Fixed value for {{${varNum}}} (same for all contacts)`}
                            className="input w-full !py-2 text-sm"
                          />
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Schedule */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Schedule (optional)</label>
                <input type="datetime-local" value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)} className="input" />
                <p className="text-xs text-gray-400 mt-1">Leave empty to send now after launching.</p>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════ */}
          {/* STEP 3: Test & Launch                                */}
          {/* ════════════════════════════════════════════════════ */}
          {step === 3 && !isApi && (
            <>
              {/* Campaign Summary */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" /> Campaign Summary
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Campaign Name</p>
                    <p className="font-semibold text-gray-900">{campaignName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Template</p>
                    <p className="font-semibold text-gray-900">{selectedTemplate?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Audience</p>
                    <p className="font-semibold text-gray-900">{audienceCount} contacts</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Schedule</p>
                    <p className="font-semibold text-gray-900">{scheduledAt ? new Date(scheduledAt).toLocaleString() : 'Send immediately'}</p>
                  </div>
                  {hasMediaHeader && headerMediaValue && (
                    <div className="col-span-2">
                      <p className="text-gray-500 text-xs">Header {selectedTemplate?.header_type}</p>
                      <p className="font-semibold text-gray-900 truncate">
                        {headerMediaType === 'url' ? headerMediaValue : `${uploadedFileName || 'Uploaded file'} (ID: ${headerMediaValue})`}
                      </p>
                    </div>
                  )}
                </div>
                {Object.keys(varMapping).filter(k => !k.startsWith('__')).length > 0 && (
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Variable Mapping</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(varMapping)
                        .filter(([varIdx]) => !varIdx.startsWith('__'))
                        .map(([varIdx, col]) => (
                          <span key={varIdx} className="text-xs bg-white border border-green-200 rounded-lg px-2 py-1">
                            <span className="font-mono text-yellow-700">{`{{${varIdx}}}`}</span> → <span className="font-semibold">{col}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Test Send Section */}
              <div className="border-2 border-blue-200 bg-blue-50/50 rounded-xl p-5 space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Phone size={16} className="text-blue-600" /> Test Before Launch
                </h3>
                <p className="text-xs text-gray-500">Send a test message to your number to verify the template looks correct with mapped variables.</p>

                <div className="flex gap-2">
                  <input
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="e.g. 919876543210"
                    className="input flex-1"
                  />
                  <button onClick={sendTest} disabled={testSending}
                    className="btn-primary flex items-center gap-2 text-sm px-5 whitespace-nowrap">
                    {testSending ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                    ) : (
                      <><Send size={14} /> Send Test</>
                    )}
                  </button>
                </div>

                {testResult && (
                  <div className={`flex items-center gap-2 text-sm rounded-lg p-3 ${
                    testResult.success
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-red-100 text-red-700 border border-red-300'
                  }`}>
                    {testResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {testResult.message}
                  </div>
                )}
              </div>

              {/* Template Preview with mapped data */}
              {selectedTemplate && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Eye size={14} className="inline mr-1" /> Message Preview
                  </label>
                  <div className="bg-[#ece5dd] rounded-xl p-4 flex justify-start">
                    <TemplatePreview template={selectedTemplate} mediaType={headerMediaType} mediaValue={headerMediaValue} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* API Campaign — Step 1 is enough */}
          {step === 1 && isApi && selectedTemplate && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
              <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <Zap size={14} /> API Campaign — No contacts needed
              </p>
              <p className="text-xs text-blue-600">
                Campaign create hone ke baad ek API endpoint milega. Aap us endpoint ko apne backend se call karke
                kisi bhi number pe message bhej sakte ho — manually contacts select karne ki zaroorat nahi.
              </p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3 flex-shrink-0">
          {/* Left side */}
          {step > 1 && !isApi && (
            <button onClick={() => setStep(step - 1)} className="btn-secondary flex items-center gap-1.5 text-sm">
              <ArrowLeft size={14} /> Back
            </button>
          )}

          <div className="flex-1" />

          {/* Right side */}
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>

          {isApi ? (
            // API: Just create
            <button onClick={handleApiCreate} disabled={saving || !canGoStep2}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
              {saving ? 'Creating...' : 'Create & Get API'}
            </button>
          ) : step === 1 ? (
            // Step 1 → Step 2
            <button onClick={() => setStep(2)} disabled={!canGoStep2}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
              Next <ArrowRight size={14} />
            </button>
          ) : step === 2 ? (
            // Step 2 → Step 3
            <button onClick={() => setStep(3)} disabled={!canGoStep3}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
              Next <ArrowRight size={14} />
            </button>
          ) : (
            // Step 3: Save Draft or Launch
            <div className="flex gap-2">
              <button onClick={handleSaveDraft} disabled={saving}
                className="btn-secondary flex items-center gap-2 text-sm">
                {saving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button onClick={handleLaunch} disabled={launching || saving}
                className="btn-primary flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700">
                {launching ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Launching...</>
                ) : (
                  <><Play size={14} /> Launch Campaign</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
