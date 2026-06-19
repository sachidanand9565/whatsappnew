'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/hooks/useApi';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { ChatbotRule } from '@/types';
import { encryptId } from '@/lib/idCrypto';

const TRIGGER_LABELS: Record<string, string> = {
  keyword:     'Contains keyword',
  contains:    'Contains',
  starts_with: 'Starts with',
  exact:       'Exact match',
  any:         'Any message',
};

export default function ChatbotPage() {
  const [rules, setRules]       = useState<ChatbotRule[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRule, setEditRule] = useState<ChatbotRule | null>(null);

  function load() {
    setLoading(true);
    apiFetch('/api/chatbot').then((r) => setRules(r.data || [])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function deleteRule(id: number) {
    if (!confirm('Delete this rule?')) return;
    await apiFetch(`/api/chatbot/${encryptId(id)}`, { method: 'DELETE' });
    toast.success('Rule deleted');
    load();
  }

  async function toggleRule(rule: ChatbotRule) {
    await apiFetch(`/api/chatbot/${rule.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...rule, is_active: rule.is_active ? 0 : 1 }),
    });
    load();
  }

  return (
    <div className="space-y-4 pb-24 lg:pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Chatbot Rules</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Auto-reply to incoming WhatsApp messages based on keywords</p>
        </div>
        <button onClick={() => { setEditRule(null); setShowModal(true); }}
          className="btn-primary flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-[0_4px_12px_rgba(22,163,74,0.15)] hover:shadow-[0_4px_20px_rgba(22,163,74,0.3)] active:translate-y-0.5 shrink-0">
          <Plus size={16} /> Add Rule
        </button>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs sm:text-sm text-blue-800 shadow-sm">
        <p className="font-semibold mb-1">How it works:</p>
        <p>When a contact sends a message, the bot checks rules in priority order (highest first). First matching rule sends the reply automatically.</p>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-10">Loading...</p>
      ) : rules.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-gray-600 font-medium">No chatbot rules yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first rule to start automating replies</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className={`card p-4 sm:p-6 transition-all hover:shadow-md border border-slate-200/60 ${rule.is_active ? 'bg-white' : 'bg-slate-50/50 opacity-60'}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                
                {/* Rule Main Details */}
                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200/40">
                      {TRIGGER_LABELS[rule.trigger_type] || rule.trigger_type}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">Priority: {rule.priority}</span>
                  </div>
                  
                  {/* Flow Trigger -> Response visualization */}
                  <div className="flex flex-col gap-2 xs:flex-row xs:items-center xs:gap-3 text-sm">
                    <div className="bg-yellow-50/60 border border-yellow-200/80 rounded-xl px-3 py-2 font-mono text-yellow-800 text-xs font-semibold w-fit">
                      &quot;{rule.trigger_value || '*'}&quot;
                    </div>
                    <span className="text-slate-300 font-bold hidden xs:inline">{"→"}</span>
                    <div className="bg-green-50/50 border border-green-200/60 rounded-xl px-3 py-2 text-slate-800 text-xs font-medium max-w-full sm:max-w-xs truncate">
                      {rule.response_text || '[Template]'}
                    </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 border-t border-slate-100 sm:border-none sm:pt-0 shrink-0">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleRule(rule)} title={rule.is_active ? 'Disable' : 'Enable'} className="p-1 hover:bg-slate-50 rounded-lg transition-colors">
                      {rule.is_active
                        ? <ToggleRight size={26} className="text-green-600" />
                        : <ToggleLeft size={26} className="text-slate-400" />}
                    </button>
                    <span className="text-xs text-slate-400 font-bold sm:hidden">
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditRule(rule); setShowModal(true); }}
                      className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-blue-200/50">
                      Edit
                    </button>
                    <button onClick={() => deleteRule(rule.id)}
                      className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all border border-slate-200/60">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <RuleModal
          rule={editRule}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}

// ---- Rule Modal ----
function RuleModal({ rule, onClose, onSaved }: {
  rule: ChatbotRule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    trigger_type:  rule?.trigger_type  || 'keyword',
    trigger_value: rule?.trigger_value || '',
    response_type: rule?.response_type || 'text',
    response_text: rule?.response_text || '',
    priority:      rule?.priority || 0,
    is_active:     rule?.is_active ?? 1,
  });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (rule) {
        await apiFetch(`/api/chatbot/${encryptId(rule.id)}`, { method: 'PUT', body: JSON.stringify(form) });
        toast.success('Rule updated');
      } else {
        await apiFetch('/api/chatbot', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Rule created');
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200/80">
          <h2 className="font-extrabold text-slate-900 text-lg tracking-tight">{rule ? 'Edit Rule' : 'New Rule'}</h2>
        </div>
        <form onSubmit={save} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Trigger Type</label>
            <select value={form.trigger_type} onChange={(e) => setForm({ ...form, trigger_type: e.target.value as 'exact' | 'keyword' | 'contains' | 'starts_with' | 'any' })} className="input">
              <option value="keyword">Contains keyword</option>
              <option value="exact">Exact match</option>
              <option value="starts_with">Starts with</option>
              <option value="any">Any message (default reply)</option>
            </select>
          </div>

          {form.trigger_type !== 'any' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Trigger Value</label>
              <input value={form.trigger_value} onChange={(e) => setForm({ ...form, trigger_value: e.target.value })}
                className="input text-sm" placeholder={`e.g. "hi", "price"`} required />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Response Text</label>
            <textarea value={form.response_text} onChange={(e) => setForm({ ...form, response_text: e.target.value })}
              className="input resize-none text-sm" rows={4}
              placeholder="Hi! Thanks for reaching out. How can we help you?" required />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Priority (higher = checked first)</label>
            <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
              className="input text-sm" min={0} max={100} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : 'Save Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
