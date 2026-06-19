'use client';
import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '@/hooks/useApi';
import { Plus, Search, Upload, Trash2, Edit2, Tag, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Contact } from '@/types';
import { encryptId } from '@/lib/idCrypto';

const STATUS_COLORS: Record<string, string> = {
  new:       'bg-green-100 text-green-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  converted: 'bg-green-100 text-green-700',
  lost:      'bg-red-100 text-red-700',
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function load(p = 1) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: '20' });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    apiFetch(`/api/contacts?${params}`).then((r) => {
      setContacts(r.data?.data || []);
      setTotal(r.data?.total || 0);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [search, status]);

  async function deleteContact(id: number) {
    if (!confirm('Delete this contact?')) return;
    await apiFetch(`/api/contacts/${encryptId(id)}`, { method: 'DELETE' });
    toast.success('Deleted');
    load(page);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    const token = localStorage.getItem('token');
    const res = await fetch('/api/contacts/import', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(`Imported ${data.data.imported}, skipped ${data.data.skipped}`);
      load();
    } else {
      toast.error(data.error);
    }
    e.target.value = '';
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Contacts ({total})</h1>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <button onClick={() => fileRef.current?.click()} className="btn-secondary flex items-center gap-2 text-sm">
            <Upload size={16} /> Import CSV
          </button>
          <button onClick={() => { setEditContact(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 focus-within:text-green-500 transition-colors" />
          <input
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, phone, email..."
            className="search-input"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-gray-100">
              <X size={12} />
            </button>
          )}
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input w-auto">
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Phone', 'City', 'Source', 'Status', 'Tags', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : contacts.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No contacts found</td></tr>
              ) : contacts.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">+{c.phone}</td>
                  <td className="px-4 py-3 text-gray-500">{c.city || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.source || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(c.tags) ? c.tags : []).map((t: string) => (
                        <span key={t} className="badge bg-green-100 text-green-700 flex items-center gap-1">
                          <Tag size={10} />{t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditContact(c); setShowModal(true); }}
                        className="text-blue-500 hover:text-blue-700 transition-colors">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => deleteContact(c.id)}
                        className="text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List View (APK Vibe) */}
        <div className="md:hidden divide-y divide-gray-100 bg-white">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No contacts found</div>
          ) : (
            contacts.map((c) => {
              const initial = (c.name || c.phone || '?').charAt(0).toUpperCase();
              const avatarColors = ['bg-orange-400','bg-purple-500','bg-blue-500','bg-green-500','bg-red-400'];
              const color = avatarColors[initial.charCodeAt(0) % avatarColors.length];
              return (
                <div key={c.id} className="p-4 flex items-start gap-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <div className={`w-10 h-10 rounded-full ${color} text-white flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{c.name || '—'}</p>
                      <span className={`badge text-[9px] px-2 py-0.5 ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">+{c.phone}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      {c.city && <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-medium">{c.city}</span>}
                      {c.source && <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-medium">{c.source}</span>}
                    </div>
                    
                    {/* Tags */}
                    {Array.isArray(c.tags) && c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {c.tags.map((t: string) => (
                          <span key={t} className="badge bg-green-50 text-green-700 border border-green-100/50 text-[9px] py-0.5 px-2 flex items-center gap-1">
                            <Tag size={8} />{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-2.5 justify-center self-center flex-shrink-0">
                    <button onClick={() => { setEditContact(c); setShowModal(true); }}
                      className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => deleteContact(c.id)}
                      className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Showing {contacts.length} of {total}</p>
        <div className="flex gap-2">
          <button onClick={() => { setPage(p => p - 1); load(page - 1); }} disabled={page === 1} className="btn-secondary text-sm px-3 py-1">
            Prev
          </button>
          <button onClick={() => { setPage(p => p + 1); load(page + 1); }} disabled={contacts.length < 20} className="btn-secondary text-sm px-3 py-1">
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ContactModal
          contact={editContact}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}

// ---- Contact Create/Edit Modal ----
function ContactModal({ contact, onClose, onSaved }: {
  contact: Contact | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name:   contact?.name || '',
    phone:  contact?.phone || '',
    email:  contact?.email || '',
    city:   contact?.city || '',
    source: contact?.source || 'manual',
    status: contact?.status || 'new',
    notes:  contact?.notes || '',
    tags:   (Array.isArray(contact?.tags) ? contact.tags : []).join(', '),
  });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const body = { ...form, tags };
      if (contact) {
        await apiFetch(`/api/contacts/${encryptId(contact.id)}`, { method: 'PUT', body: JSON.stringify(body) });
        toast.success('Contact updated');
      } else {
        await apiFetch('/api/contacts', { method: 'POST', body: JSON.stringify(body) });
        toast.success('Contact added');
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error saving contact');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-bold text-lg">{contact ? 'Edit Contact' : 'Add Contact'}</h2>
        </div>
        <form onSubmit={save} className="p-6 space-y-4">
          {[
            { label: 'Name', key: 'name', type: 'text', placeholder: 'John Doe' },
            { label: 'Phone *', key: 'phone', type: 'text', placeholder: '919876543210' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'john@example.com' },
            { label: 'City', key: 'city', type: 'text', placeholder: 'Mumbai' },
            { label: 'Source', key: 'source', type: 'text', placeholder: 'website, manual...' },
            { label: 'Tags (comma separated)', key: 'tags', type: 'text', placeholder: 'vip, hot-lead' },
            { label: 'Notes', key: 'notes', type: 'text', placeholder: 'Any notes...' },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type={f.type}
                value={form[f.key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="input" placeholder={f.placeholder}
                required={f.key === 'phone'}
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'new' | 'contacted' | 'converted' | 'lost' })} className="input">
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
