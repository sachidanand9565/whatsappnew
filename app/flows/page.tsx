'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/hooks/useApi';
import { Plus, Zap, ToggleLeft, ToggleRight, Trash2, Pencil, TrendingUp, Play } from 'lucide-react';
import toast from 'react-hot-toast';

interface Flow {
  id: number;
  name: string;
  description: string;
  trigger_keywords: string[];
  trigger_type: string;
  is_active: number;
  triggered_count: number;
  completed_count: number;
  updated_at: string;
}

export default function FlowsPage() {
  const [flows, setFlows]       = useState<Flow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showNew, setShowNew]   = useState(false);
  const [name, setName]         = useState('');
  const [creating, setCreating] = useState(false);

  function load() {
    apiFetch('/api/flows').then(r => {
      if (r?.data) setFlows(r.data);
    }).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function createFlow() {
    if (!name.trim()) return;
    setCreating(true);
    const r = await apiFetch('/api/flows', { method: 'POST', body: JSON.stringify({ name }) });
    if (r?.data?.id) {
      window.location.href = `/flows/${r.data.id}`;
    } else {
      toast.error('Failed to create flow');
      setCreating(false);
    }
  }

  async function toggleActive(flow: Flow) {
    await apiFetch(`/api/flows/${flow.id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: !flow.is_active }),
    });
    toast.success(flow.is_active ? 'Flow deactivated' : 'Flow activated!');
    load();
  }

  async function deleteFlow(id: number) {
    if (!confirm('Delete this flow?')) return;
    await apiFetch(`/api/flows/${id}`, { method: 'DELETE' });
    toast.success('Deleted');
    load();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flows</h1>
          <p className="text-sm text-gray-500 mt-1">Automate WhatsApp conversations with visual flows</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-whatsapp-green hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> New Flow
        </button>
      </div>

      {/* New Flow Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold mb-4">Create New Flow</h2>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createFlow()}
              placeholder="Flow name (e.g. Welcome Flow)"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowNew(false); setName(''); }}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={createFlow} disabled={creating || !name.trim()}
                className="flex-1 bg-whatsapp-green text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                {creating ? 'Creating...' : 'Create & Edit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flows Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-40 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : flows.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
            <Zap size={32} className="text-whatsapp-green" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">No flows yet</h3>
          <p className="text-gray-500 text-sm mt-2 max-w-xs">
            Create your first flow to automate WhatsApp conversations
          </p>
          <button onClick={() => setShowNew(true)}
            className="mt-5 flex items-center gap-2 bg-whatsapp-green text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
            <Plus size={15} /> Create First Flow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows.map(flow => (
            <div key={flow.id} className="card hover:shadow-md transition-all group">
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{flow.name}</h3>
                  {flow.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{flow.description}</p>
                  )}
                </div>
                <button onClick={() => toggleActive(flow)} className="ml-2 shrink-0">
                  {flow.is_active
                    ? <ToggleRight size={28} className="text-whatsapp-green" />
                    : <ToggleLeft  size={28} className="text-gray-300" />}
                </button>
              </div>

              {/* Status */}
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                flow.is_active
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${flow.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                {flow.is_active ? 'Active' : 'Inactive'}
              </span>

              {/* Keywords */}
              {flow.trigger_keywords?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {flow.trigger_keywords.slice(0, 4).map((kw, i) => (
                    <span key={i} className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      {kw}
                    </span>
                  ))}
                  {flow.trigger_keywords.length > 4 && (
                    <span className="text-[11px] text-gray-400">+{flow.trigger_keywords.length - 4} more</span>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Play size={12} className="text-green-500" />
                  {flow.triggered_count} triggered
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <TrendingUp size={12} className="text-blue-500" />
                  {flow.triggered_count > 0
                    ? Math.round((flow.completed_count / flow.triggered_count) * 100)
                    : 0}% completed
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <Link href={`/flows/${flow.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-medium transition-colors">
                  <Pencil size={12} /> Edit Flow
                </Link>
                <button onClick={() => deleteFlow(flow.id)}
                  className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
