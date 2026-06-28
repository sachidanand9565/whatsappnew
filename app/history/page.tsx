'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { apiFetch } from '@/hooks/useApi';
import { Search, CheckCircle, MapPin, User, FileText, Download, Music, LayoutTemplate, ArrowLeft, X } from 'lucide-react';
import TemplateComposer from '@/app/components/TemplateComposer';
import TemplateBubble from '@/app/components/TemplateBubble';
import toast from 'react-hot-toast';
import { Contact, Message } from '@/types';

// ── Shared content parsers (same as inbox) ────────────────────
function parseTemplateContent(c: string) {
  try { const p = JSON.parse(c); if (p.__type === 'template') return p; } catch { /**/ } return null;
}
function parseMediaContent(c: string) {
  try { const p = JSON.parse(c); if (p.__type === 'media' && p.media_id) return p; } catch { /**/ } return null;
}
function parseLocationContent(c: string) {
  try { const p = JSON.parse(c); if (p.__type === 'location') return p; } catch { /**/ } return null;
}
function parseContactsContent(c: string) {
  try { const p = JSON.parse(c); if (p.__type === 'contacts') return p; } catch { /**/ } return null;
}

function renderMessageContent(m: Message, onMedia?: (mm: { src: string; type: string; filename?: string }) => void) {
  const media    = parseMediaContent(m.content);
  const location = parseLocationContent(m.content);
  const contacts = parseContactsContent(m.content);

  if (media) {
    const src = `/api/media/${media.media_id}?workspaceId=${media.workspace_id}`;
    if (m.type === 'image' || m.type === 'sticker') return (
      <img src={src} alt="Image"
        onClick={() => onMedia?.({ src, type: 'image', filename: media.filename })}
        className="rounded-xl max-w-full max-h-64 object-cover cursor-zoom-in hover:opacity-95 transition-opacity"
        loading="lazy" />
    );
    if (m.type === 'video') return (
      <video src={src} controls
        onClick={() => onMedia?.({ src, type: 'video', filename: media.filename })}
        className="rounded-xl max-w-full max-h-64 cursor-zoom-in" />
    );
    if (m.type === 'audio') return <div className="flex items-center gap-2"><Music size={16} className="text-gray-500" /><audio src={src} controls className="h-8 w-48" /></div>;
    if (m.type === 'document') return (
      <a href={src} download={media.filename || 'document'} target="_blank" rel="noreferrer"
        className="flex items-center gap-2 bg-white/50 rounded-xl px-3 py-2 hover:bg-white/80">
        <FileText size={16} className="text-gray-500" />
        <span className="text-sm truncate max-w-[180px]">{media.filename || 'Document'}</span>
        <Download size={14} className="text-gray-400 ml-auto" />
      </a>
    );
  }
  if (location) {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    return (
      <a href={url} target="_blank" rel="noreferrer" className="flex items-start gap-2 hover:opacity-80">
        <div className="w-20 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
          <MapPin size={20} className="text-red-500" />
        </div>
        <div><p className="text-sm font-semibold">{location.name || 'Location'}</p>
          {location.address && <p className="text-xs text-gray-500 mt-0.5">{location.address}</p>}
          <p className="text-xs text-blue-500 mt-1">Open in Maps ↗</p>
        </div>
      </a>
    );
  }
  if (contacts) {
    return (
      <div className="space-y-1.5">
        {contacts.contacts?.map((ct: Record<string, unknown>, i: number) => {
          const name  = (ct.name as Record<string, unknown>)?.formatted_name as string || 'Contact';
          const phone = ((ct.phones as Record<string, unknown>[])?.[0]?.phone as string) || '';
          return (
            <div key={i} className="flex items-center gap-2 bg-white/50 rounded-xl px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={14} className="text-gray-500" />
              </div>
              <div><p className="text-sm font-semibold">{name}</p>{phone && <p className="text-xs text-gray-500">{phone}</p>}</div>
            </div>
          );
        })}
      </div>
    );
  }
  // Interactive buttons / list (flow-sent) — current (__type) + legacy (_type) formats
  try {
    const p = JSON.parse(m.content);
    const t = p.__type || p._type;
    if (t === 'interactive') {
      return (
        <div className="space-y-1.5">
          <p className="whitespace-pre-wrap break-words leading-relaxed">{p.body}</p>
          {(p.buttons || []).map((b: { text?: string; title?: string }, i: number) => (
            <div key={i} className="bg-white text-green-600 font-semibold text-xs py-1.5 px-3 rounded-lg text-center border border-gray-100">{b.text || b.title}</div>
          ))}
        </div>
      );
    }
    if (t === 'interactive_list' || t === 'interactivelist') {
      return (
        <div className="space-y-1.5">
          <p className="whitespace-pre-wrap break-words leading-relaxed">{p.body}</p>
          <div className="bg-white text-green-600 font-semibold text-xs py-1.5 px-3 rounded-lg text-center border border-gray-100">≡ {p.button || 'Menu'}</div>
          {(p.sections || []).map((s: { title?: string; rows?: { title?: string; description?: string }[] }, si: number) => (
            <div key={si} className="mt-1">
              {s.title && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{s.title}</p>}
              {(s.rows || []).map((r, ri: number) => (
                <div key={ri} className="text-xs text-gray-700 py-0.5 border-b border-gray-100 last:border-0">
                  {r.title}{r.description ? <span className="text-gray-400"> — {r.description}</span> : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }
  } catch { /* plain text */ }

  return <p className="break-words whitespace-pre-wrap leading-relaxed">{m.content}</p>;
}

export default function HistoryPage() {
  const [contacts, setContacts]     = useState<Contact[]>([]);
  const [selected, setSelected]     = useState<Contact | null>(null);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [search, setSearch]         = useState('');
  const [actioning, setActioning]   = useState(false);
  const [templates, setTemplates]   = useState<{ id: number; name: string; language: string; body_text: string; status: string }[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [sendingTpl, setSendingTpl] = useState<number | null>(null);
  const [lightbox, setLightbox]     = useState<{ src: string; type: string; filename?: string } | null>(null);
  const bottomRef                   = useRef<HTMLDivElement>(null);

  const loadContacts = useCallback(() => {
    apiFetch('/api/contacts?limit=200&chatStatus=history').then((r) => setContacts(r.data?.data || []));
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  useEffect(() => {
    if (!selected) return;
    apiFetch(`/api/messages?contactId=${selected.id}&limit=80`).then((r) => setMessages(r.data || []));
  }, [selected]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadTemplates = useCallback(() => {
    if (templates.length > 0) return;
    apiFetch('/api/templates').then((r) => {
      setTemplates((r.data || []).filter((t: { status: string }) => t.status === 'APPROVED'));
    });
  }, [templates.length]);

  async function sendTemplate(templateName: string, language: string, tplId: number) {
    if (!selected) return;
    setSendingTpl(tplId);
    try {
      await apiFetch('/api/send-message', {
        method: 'POST',
        body: JSON.stringify({ contactId: selected.id, type: 'template', templateName, language }),
      });
      setShowTemplates(false);
      apiFetch(`/api/messages?contactId=${selected.id}&limit=80`).then((r) => setMessages(r.data || []));
      toast.success('Template sent!');
    } catch (err) {
      toast.error('Failed: ' + (err instanceof Error ? err.message : 'error'));
    } finally {
      setSendingTpl(null);
    }
  }

  const filtered = contacts.filter((c) => (c.name || c.phone).toLowerCase().includes(search.toLowerCase()));
  const avatarColors = ['bg-orange-400', 'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-red-400'];
  const getColor = (ch: string) => avatarColors[ch.charCodeAt(0) % avatarColors.length];

  return (
    <div className="h-full lg:h-[calc(100vh-5rem)] flex border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">

      {/* Left: Contact list */}
      <div className={`w-full lg:w-72 border-r border-gray-200 flex flex-col flex-shrink-0 ${selected ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history..." className="input pl-9 text-sm py-2" />
          </div>
        </div>
        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
          <CheckCircle size={14} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resolved ({filtered.length})</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && <p className="text-center text-gray-400 text-xs py-10">No resolved chats</p>}
          {filtered.map((c) => {
            const initial = (c.name || c.phone).charAt(0).toUpperCase();
            return (
              <button key={c.id} onClick={() => setSelected(c)}
                className={`w-full text-left px-3 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-center gap-3
                  ${selected?.id === c.id ? 'bg-green-50 border-l-2 border-l-green-600' : ''}`}>
                <div className={`w-10 h-10 rounded-full ${getColor(initial)} text-white flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm truncate font-medium text-gray-700">{c.name || c.phone}</p>
                    {c.last_message_at && (
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(c.last_message_at.includes('Z') || c.last_message_at.includes('+') ? c.last_message_at : c.last_message_at.replace(' ', 'T') + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">+{c.phone}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Middle: Chat (read-only) */}
      {selected ? (
        <div className={`flex-1 flex flex-col min-w-0 ${selected ? 'flex' : 'hidden lg:flex'}`}>
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 bg-white">
            {/* Back button for mobile view (APK feel) */}
            <button 
              onClick={() => setSelected(null)} 
              className="lg:hidden p-1.5 hover:bg-slate-100 rounded-full text-slate-500 mr-1"
            >
              <ArrowLeft size={20} />
            </button>
            <div className={`w-9 h-9 rounded-full ${getColor((selected.name || selected.phone).charAt(0).toUpperCase())} text-white flex items-center justify-center font-bold text-sm`}>
              {(selected.name || selected.phone).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900">{selected.name || selected.phone}</p>
              <p className="text-xs text-gray-400">+{selected.phone}</p>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
              <CheckCircle size={12} /> Resolved
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#f0f0f0]"
            style={{ backgroundImage: 'radial-gradient(circle, #d4d4d4 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            {messages.map((m) => {
              const tpl     = parseTemplateContent(m.content);
              const _ts = m.created_at;
              const timeStr = new Date(_ts.includes('Z') || _ts.includes('+') ? _ts : _ts.replace(' ', 'T') + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              // System message — centered badge (intervene/resolve/reopen events)
              const isSystemMsg = m.type === 'system' ||
                (m.content?.startsWith('Intervened by ') || m.content?.startsWith('Closed by ') || m.content?.startsWith('Reopened by '));
              if (isSystemMsg) {
                return (
                  <div key={m.id} className="flex items-center justify-center my-1">
                    <span className="bg-gray-200/80 text-gray-500 text-xs px-4 py-1.5 rounded-full shadow-sm">
                      {m.content}
                    </span>
                  </div>
                );
              }

              return (
                <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                  {tpl ? (
                    <TemplateBubble data={tpl} status={m.status || ''} time={timeStr} />
                  ) : (
                    <div className={`max-w-xs lg:max-w-sm rounded-2xl text-sm shadow-sm overflow-hidden
                      ${m.direction === 'outbound' ? 'bg-[#dcf8c6] text-gray-800 rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm'}`}>
                      <div className="px-3 py-2">
                        {renderMessageContent(m, setLightbox)}
                        <p className={`text-xs mt-1 ${m.direction === 'outbound' ? 'text-right text-gray-400' : 'text-gray-300'}`}>{timeStr}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Template picker panel — shared inbox-style composer (vars + media + buttons) */}
          {showTemplates && selected && (
            <TemplateComposer
              contactId={selected.id}
              onSent={() => apiFetch(`/api/messages?contactId=${selected.id}&limit=80`).then((r) => setMessages(r.data || []))}
              onClose={() => setShowTemplates(false)}
            />
          )}
          <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-400">24h session expired — send a template to re-engage</p>
            <button
              onClick={() => { loadTemplates(); setShowTemplates((v) => !v); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0">
              <LayoutTemplate size={13} />
              Send Template
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <CheckCircle size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Select a resolved chat</p>
            <p className="text-sm text-gray-400 mt-1">View past conversation history</p>
          </div>
        </div>
      )}

      {/* Media lightbox — enlarge + download */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <a
            href={lightbox.src}
            download={lightbox.filename || 'download'}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-16 flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download size={16} /> Download
          </a>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X size={28} />
          </button>
          <div onClick={(e) => e.stopPropagation()} className="max-w-[92vw] max-h-[86vh]">
            {lightbox.type === 'video' ? (
              <video src={lightbox.src} controls autoPlay className="max-w-[92vw] max-h-[86vh] rounded-lg" />
            ) : (
              <img src={lightbox.src} alt="" className="max-w-[92vw] max-h-[86vh] rounded-lg object-contain" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
