'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { apiFetch } from '@/hooks/useApi';
import { Send, Search, FileText, Image, FileVideo, File, ChevronDown, ChevronUp, Download, Music, MapPin, User, UserCheck, CheckCircle, Loader2, LayoutTemplate, X, Clock, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Contact, Message } from '@/types';

// ── Template bubble types ─────────────────────────────────────
interface TemplateContent {
  __type: 'template';
  template_name: string;
  header_type: string;
  header_content: string;
  body: string;
  footer: string;
  buttons: { type: string; text: string }[];
}
// MySQL timestamps are stored in UTC via utcNow(). Append 'Z' so JS Date
// treats them as UTC and toLocaleTimeString/toLocaleDateString convert to IST correctly.
function toLocalDate(ts: string): Date {
  if (!ts) return new Date();
  if (ts.includes('Z') || ts.includes('+')) return new Date(ts);
  return new Date(ts.replace(' ', 'T') + 'Z');
}

function parseTemplateContent(content: string): TemplateContent | null {
  try {
    const p = JSON.parse(content);
    if (p.__type === 'template') return p as TemplateContent;
  } catch { /**/ }
  return null;
}

// ── Media message types ───────────────────────────────────────
interface MediaContent {
  __type: 'media';
  media_id: string;
  mime_type?: string;
  filename?: string;
  caption?: string;
  workspace_id: number;
}
function parseMediaContent(content: string): MediaContent | null {
  try {
    const p = JSON.parse(content);
    if (p.__type === 'media' && p.media_id) return p as MediaContent;
  } catch { /**/ }
  return null;
}

function MediaBubble({ data, msgType }: { data: MediaContent; msgType: string }) {
  const src = `/api/media/${data.media_id}?workspaceId=${data.workspace_id}`;
  const isImage = msgType === 'image';
  const isAudio = msgType === 'audio';
  const isVideo = msgType === 'video';
  const isDoc   = msgType === 'document';

  return (
    <div className="max-w-xs">
      {isImage && (
        <img
          src={src}
          alt={data.caption || 'Image'}
          className="rounded-xl max-w-full max-h-64 object-cover"
          loading="lazy"
        />
      )}
      {isVideo && (
        <video
          src={src}
          controls
          className="rounded-xl max-w-full max-h-64"
        />
      )}
      {isAudio && (
        <div className="flex items-center gap-2 px-3 py-2 bg-white/50 rounded-xl">
          <Music size={16} className="text-gray-500 flex-shrink-0" />
          <audio src={src} controls className="h-8 w-48" />
        </div>
      )}
      {isDoc && (
        <a
          href={src}
          download={data.filename || 'document'}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-3 py-2 bg-white/50 rounded-xl hover:bg-white/80 transition-colors"
        >
          <FileText size={16} className="text-gray-500 flex-shrink-0" />
          <span className="text-sm text-gray-700 truncate max-w-[180px]">{data.filename || 'Document'}</span>
          <Download size={14} className="text-gray-400 flex-shrink-0 ml-auto" />
        </a>
      )}
      {data.caption && (
        <p className="text-xs text-gray-600 mt-1 px-1 break-words">{data.caption}</p>
      )}
    </div>
  );
}

// ── Location message ─────────────────────────────────────────
interface LocationContent { __type: 'location'; latitude: number; longitude: number; name?: string; address?: string }
function parseLocationContent(c: string): LocationContent | null {
  try { const p = JSON.parse(c); if (p.__type === 'location') return p; } catch { /**/ } return null;
}
function LocationBubble({ data }: { data: LocationContent }) {
  const url = `https://www.google.com/maps?q=${data.latitude},${data.longitude}`;
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="flex items-start gap-2 hover:opacity-80 transition-opacity">
      <div className="w-24 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 relative">
        <img
          src={`https://maps.googleapis.com/maps/api/staticmap?center=${data.latitude},${data.longitude}&zoom=15&size=96x80&markers=${data.latitude},${data.longitude}&key=`}
          alt="map"
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <MapPin size={20} className="absolute inset-0 m-auto text-red-500" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800">{data.name || 'Location'}</p>
        {data.address && <p className="text-xs text-gray-500 mt-0.5 break-words">{data.address}</p>}
        <p className="text-xs text-blue-500 mt-1">Open in Maps ↗</p>
      </div>
    </a>
  );
}

// ── Contact message ───────────────────────────────────────────
interface ContactEntry { name?: { formatted_name?: string }; phones?: { phone?: string }[]; }
interface ContactsContent { __type: 'contacts'; contacts: ContactEntry[] }
function parseContactsContent(c: string): ContactsContent | null {
  try { const p = JSON.parse(c); if (p.__type === 'contacts') return p; } catch { /**/ } return null;
}
function ContactsBubble({ data }: { data: ContactsContent }) {
  return (
    <div className="space-y-1.5">
      {data.contacts?.map((ct, i) => {
        const name  = ct.name?.formatted_name || 'Contact';
        const phone = ct.phones?.[0]?.phone || '';
        return (
          <div key={i} className="flex items-center gap-2 bg-white/50 rounded-xl px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
              {phone && <p className="text-xs text-gray-500">{phone}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── WhatsApp template bubble ──────────────────────────────────
function TemplateBubble({ data, status, time }: { data: TemplateContent; status: string; time: string }) {
  const HeaderIcon = data.header_type === 'IMAGE' ? Image
    : data.header_type === 'VIDEO'    ? FileVideo
    : data.header_type === 'DOCUMENT' ? File : FileText;

  return (
    <div className="w-72 rounded-2xl rounded-br-sm overflow-hidden shadow-sm border border-green-100">
      {data.header_type && data.header_type !== 'NONE' && (
        <div className="bg-gray-100 px-4 py-2.5">
          {data.header_type === 'TEXT'
            ? <p className="font-bold text-gray-800 text-sm">{data.header_content}</p>
            : <div className="flex items-center gap-2 text-gray-500 text-sm"><HeaderIcon size={15} /><span>{data.header_type}</span></div>}
        </div>
      )}
      <div className="bg-[#dcf8c6] px-4 py-2.5">
        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed">{data.body}</p>
        {data.footer && <p className="text-xs text-gray-400 mt-1.5">{data.footer}</p>}
        <p className="text-xs text-gray-400 text-right mt-1">
          {time}
          <span className={`ml-1 ${status === 'read' ? 'text-blue-500' : 'text-gray-400'}`}>
            {status === 'read' || status === 'delivered' ? '✓✓' : '✓'}
          </span>
        </p>
      </div>
      {data.buttons?.length > 0 && (
        <div className="divide-y divide-gray-200 border-t border-gray-200">
          {data.buttons.map((btn, i) => (
            <div key={i} className="bg-white px-4 py-2 text-center text-sm font-medium text-[#00a5f4]">{btn.text}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Contact Profile Panel ─────────────────────────────────────
function ProfilePanel({ contact, templateMsgCount, sessionMsgCount }: { contact: Contact; templateMsgCount: number; sessionMsgCount: number }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ info: true });
  const toggle = (k: string) => setOpen(p => ({ ...p, [k]: !p[k] }));

  const initial = (contact.name || contact.phone || '?').charAt(0).toUpperCase();
  const avatarColors = ['bg-orange-400', 'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-red-400'];
  const color = avatarColors[initial.charCodeAt(0) % avatarColors.length];

  const chatStatusBadge = contact.chat_status === 'intervened'
    ? <span className="text-orange-600 font-semibold">Intervened</span>
    : contact.chat_status === 'resolved'
    ? <span className="text-green-600 font-semibold">Resolved</span>
    : <span className="text-gray-600 font-semibold">Open</span>;

  const infoRows = [
    { label: 'Status',            value: <span className={`font-semibold ${contact.status === 'converted' ? 'text-green-600' : 'text-gray-700'}`}>{contact.status || 'Active'}</span> },
    { label: 'Chat Status',       value: chatStatusBadge },
    ...(contact.chat_status === 'intervened' && contact.intervened_by
      ? [{
          label: contact.assigned_agent_id ? 'Transferred By' : 'Intervened By',
          value: <span className={`font-semibold ${contact.assigned_agent_id ? 'text-blue-600' : 'text-orange-600'}`}>{contact.intervened_by}</span>,
        }]
      : []),
    { label: 'Last Active',       value: contact.updated_at ? toLocalDate(contact.updated_at).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : '—' },
    { label: 'Template Messages', value: templateMsgCount },
    { label: 'Session Messages',  value: sessionMsgCount },
    { label: 'Source',            value: contact.source || '—' },
    { label: 'Opted In',          value: contact.opted_in ? <span className="text-green-600 font-semibold">Yes</span> : <span className="text-red-400">No</span> },
  ];

  return (
    <div className="w-72 border-l border-gray-200 bg-white flex flex-col overflow-y-auto">
      {/* Avatar + name */}
      <div className="p-5 border-b border-gray-100 text-center">
        <div className={`w-14 h-14 rounded-full ${color} text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3`}>
          {initial}
        </div>
        <p className="font-bold text-gray-900">{contact.name || contact.phone}</p>
        <p className="text-sm text-gray-400 mt-0.5">+{contact.phone}</p>
      </div>

      {/* Info section */}
      <div className="border-b border-gray-100">
        <button onClick={() => toggle('info')}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Chat Profile
          {open.info ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {open.info && (
          <div className="px-4 pb-4 space-y-2.5">
            {infoRows.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="text-gray-700 text-right">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="border-b border-gray-100">
        <button onClick={() => toggle('tags')}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Tags
          {open.tags ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {open.tags && (
          <div className="px-4 pb-4">
            {contact.tags && (Array.isArray(contact.tags) ? contact.tags : (() => { try { return JSON.parse(contact.tags as string); } catch { return []; } })()).length > 0
              ? (Array.isArray(contact.tags) ? contact.tags : JSON.parse(contact.tags as string)).map((t: string, i: number) => (
                <span key={i} className="inline-block bg-blue-100 text-blue-700 text-xs rounded-full px-2.5 py-0.5 mr-1 mb-1">{t}</span>
              ))
              : <p className="text-xs text-gray-400">No tags</p>}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="border-b border-gray-100">
        <button onClick={() => toggle('notes')}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Notes
          {open.notes ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {open.notes && (
          <div className="px-4 pb-4">
            <p className="text-xs text-gray-400">{contact.notes || 'No notes'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Inbox Page ───────────────────────────────────────────
export default function InboxPage() {
  const [contacts, setContacts]     = useState<Contact[]>([]);
  const [selected, setSelected]     = useState<Contact | null>(null);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [text, setText]             = useState('');
  const [search, setSearch]         = useState('');
  const [sending, setSending]       = useState(false);
  const [actioning, setActioning]   = useState(false);
  const [tab, setTab]               = useState<'all' | 'requested' | 'intervened'>('requested');
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates]   = useState<{ id: number; name: string; language: string; body_text: string; status: string }[]>([]);
  const [sendingTpl, setSendingTpl] = useState<number | null>(null);
  const [showTransfer, setShowTransfer]     = useState(false);
  const [transferAgents, setTransferAgents] = useState<{ id: number; name: string; workspace_role: string }[]>([]);
  const [loadingAgents, setLoadingAgents]   = useState(false);
  const [transferring, setTransferring]     = useState(false);
  const transferRef                         = useRef<HTMLDivElement>(null);
  const bottomRef                           = useRef<HTMLDivElement>(null);
  const chatRef                             = useRef<HTMLDivElement>(null);

  // SSE-driven unread counts — persisted in localStorage, cleared on select
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>(() => {
    try { return JSON.parse(localStorage.getItem('unreadCounts') || '{}'); } catch { return {}; }
  });
  const saveUnread = (counts: Record<number, number>) => {
    localStorage.setItem('unreadCounts', JSON.stringify(counts));
  };

  const loadContacts = useCallback(() => {
    apiFetch('/api/contacts?limit=200&chatStatus=inbox').then((r) => {
      const list: Contact[] = r.data?.data || [];
      // Keep unread_count = 0 for the currently open contact
      setContacts(list.map(c =>
        selectedRef.current?.id === c.id ? { ...c, unread_count: 0 } : c
      ));
    });
  }, []);

  useEffect(() => {
    loadContacts();
    const iv = setInterval(loadContacts, 60_000); // fallback poll every 60s
    return () => clearInterval(iv);
  }, [loadContacts]);

  const loadMessages = useCallback((contactId: number) => {
    apiFetch(`/api/messages?contactId=${contactId}&limit=80`).then((r) => setMessages(r.data || []));
  }, []);

  // Track selected contact in a ref so the SSE handler always sees the latest value
  const selectedRef = useRef<Contact | null>(null);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // SSE — real-time updates triggered by incoming webhook messages
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const es = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as { type?: string; contactId?: number; direction?: string };
        if (data.type === 'new_message') {
          loadContacts();
          if (selectedRef.current?.id === data.contactId) {
            loadMessages(data.contactId!);
          } else if (data.contactId && data.direction === 'inbound') {
            // Only increment badge for inbound — chatbot/agent outbound must NOT count
            setUnreadCounts(prev => {
              const next = { ...prev, [data.contactId!]: (prev[data.contactId!] || 0) + 1 };
              saveUnread(next);
              return next;
            });
          }
        }
      } catch { /* ignore malformed frames */ }
    };

    es.onerror = () => es.close(); // browser will reconnect on its own after close

    return () => es.close();
  }, [loadContacts, loadMessages]);

  const loadTemplates = useCallback(() => {
    if (templates.length > 0) return;
    apiFetch('/api/templates').then((r) => {
      const approved = (r.data || []).filter((t: { status: string }) => t.status === 'APPROVED');
      setTemplates(approved);
    });
  }, [templates.length]);

  // 24h session: open if user messaged us OR we sent a template within 24h
  const isSessionOpen = messages.some((m) =>
    Date.now() - toLocalDate(m.created_at).getTime() < 24 * 60 * 60 * 1000 &&
    (m.direction === 'inbound' || (m.direction === 'outbound' && m.type === 'template'))
  );

  function selectContact(c: Contact) {
    setSelected(c);
    setUnreadCounts(prev => {
      const next = { ...prev, [c.id]: 0 };
      saveUnread(next);
      return next;
    });
  }

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.id);
  }, [selected, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!text.trim() || !selected) return;
    setSending(true);
    const msgText = text;
    setText('');

    // Optimistic update — show message immediately
    const optimistic = {
      id: Date.now(), workspace_id: selected.id, contact_id: selected.id,
      wamid: '', direction: 'outbound' as const, type: 'text',
      content: msgText, template_id: 0, campaign_id: 0,
      status: 'queued' as const, error_message: '',
      sent_at: new Date().toISOString(), delivered_at: '', read_at: '',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await apiFetch('/api/send-message', {
        method: 'POST',
        body: JSON.stringify({ contactId: selected.id, type: 'text', text: msgText }),
      });
      // Reload to get real wamid and status from server
      loadMessages(selected.id);
    } catch (err) {
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(msgText);
      toast.error('Failed: ' + (err instanceof Error ? err.message : 'error'));
    } finally {
      setSending(false);
    }
  }

  async function sendTemplate(templateName: string, language: string, tplId: number) {
    if (!selected) return;
    setSendingTpl(tplId);
    try {
      await apiFetch('/api/send-message', {
        method: 'POST',
        body: JSON.stringify({ contactId: selected.id, type: 'template', templateName, language }),
      });
      setShowTemplates(false);
      loadMessages(selected.id);
      toast.success('Template sent!');
    } catch (err) {
      toast.error('Failed: ' + (err instanceof Error ? err.message : 'error'));
    } finally {
      setSendingTpl(null);
    }
  }

  async function intervene() {
    if (!selected || actioning) return;
    setActioning(true);
    const userName = localStorage.getItem('userName') || 'Agent';
    // Optimistically append "Intervened by" at the END so it appears below the last message
    const optimistic = {
      id: Date.now(), workspace_id: selected.id, contact_id: selected.id,
      wamid: '', direction: 'outbound' as const, type: 'system',
      content: `Intervened by ${userName}`, template_id: 0, campaign_id: 0,
      status: 'delivered' as const, error_message: '',
      sent_at: new Date().toISOString(), delivered_at: '', read_at: '',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      await apiFetch(`/api/contacts/${selected.id}`, {
        method: 'PUT',
        body: JSON.stringify({ chat_status: 'intervened' }),
      });
      const updated = { ...selected, chat_status: 'intervened' as const };
      setSelected(updated);
      setContacts((prev) => prev.map((c) => c.id === selected.id ? updated : c));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      toast.error('Failed to intervene');
    }
    finally { setActioning(false); }
  }

  async function resolve() {
    if (!selected || actioning) return;
    setActioning(true);
    const userName = localStorage.getItem('userName') || 'Agent';
    try {
      // Optimistically add "Closed by" at the BOTTOM before clearing
      const closedMsg = {
        id: Date.now(), workspace_id: selected.id, contact_id: selected.id,
        wamid: '', direction: 'outbound' as const, type: 'system',
        content: `Closed by ${userName}`, template_id: 0, campaign_id: 0,
        status: 'delivered' as const, error_message: '',
        sent_at: new Date().toISOString(), delivered_at: '', read_at: '',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, closedMsg]);

      await apiFetch(`/api/contacts/${selected.id}`, {
        method: 'PUT',
        body: JSON.stringify({ chat_status: 'resolved' }),
      });

      // Mark resolved locally — contact stays in "All" for 24h, then auto-moves to History
      const resolved = { ...selected, chat_status: 'resolved' as const };
      setContacts((prev) => prev.map((c) => c.id === selected.id ? resolved : c));
      setSelected(null);
      setMessages([]);
      toast.success('Chat resolved — visible in All for 24 hours, then moves to History');
    } catch { toast.error('Failed to resolve'); }
    finally { setActioning(false); }
  }

  // Close transfer dropdown when clicking outside
  useEffect(() => {
    if (!showTransfer) return;
    function handleOutside(e: MouseEvent) {
      if (transferRef.current && !transferRef.current.contains(e.target as Node)) {
        setShowTransfer(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showTransfer]);

  async function openTransfer() {
    if (transferAgents.length === 0 && !showTransfer) {
      setLoadingAgents(true);
      try {
        const r = await apiFetch('/api/agents');
        setTransferAgents(r.data || []);
      } catch { toast.error('Failed to load agents'); }
      finally { setLoadingAgents(false); }
    }
    setShowTransfer((v) => !v);
  }

  async function transferChat(agent: { id: number; name: string }) {
    if (!selected || transferring) return;
    setTransferring(true);
    setShowTransfer(false);
    try {
      await apiFetch(`/api/contacts/${selected.id}`, {
        method: 'PUT',
        body: JSON.stringify({ transfer_to_id: agent.id }),
      });
      // Remove from current agent's view immediately
      setContacts((prev) => prev.filter((c) => c.id !== selected.id));
      setSelected(null);
      setMessages([]);
      toast.success(`Chat transferred to ${agent.name}`);
    } catch { toast.error('Failed to transfer'); }
    finally { setTransferring(false); }
  }

  function scrollToReplied(wamid: string) {
    const el = document.getElementById(`msg-${wamid}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-whatsapp-green', 'ring-offset-1', 'rounded-xl');
      setTimeout(() => el.classList.remove('ring-2', 'ring-whatsapp-green', 'ring-offset-1', 'rounded-xl'), 1500);
    }
  }

  const filtered = contacts.filter((c) =>
    (c.name || c.phone).toLowerCase().includes(search.toLowerCase())
  );

  const templateMsgCount = messages.filter((m) => m.type === 'template' && m.direction === 'outbound').length;
  const sessionMsgCount  = messages.filter((m) => m.direction === 'outbound' && m.type !== 'template').length;

  return (
    <div className="h-[calc(100vh-5rem)] flex border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">

      {/* ── Left: Contact List ──────────────────────────────── */}
      <div className="w-72 border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..." className="input pl-9 text-sm py-2" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['all', 'requested', 'intervened'] as const).map((t) => {
            const requestedCount  = filtered.filter((c) => (c.chat_status === 'open' || !c.chat_status) && Number(c.inbound_count) > 0).length;
            const intervenedCount = filtered.filter((c) => c.chat_status === 'intervened').length;
            const label =
              t === 'all' ? `All (${contacts.length})` :
              t === 'requested' ? (
                <span className="flex items-center gap-1">
                  Requested
                  {requestedCount > 0 && <span className="bg-whatsapp-green text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{requestedCount}</span>}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  Intervened
                  {intervenedCount > 0 && <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{intervenedCount}</span>}
                </span>
              );
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                  tab === t ? 'border-b-2 border-whatsapp-green text-whatsapp-teal' : 'text-gray-400'}`}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Contact items */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-xs py-10">No contacts</p>
          )}
          {filtered
            .filter((c) => {
              if (tab === 'all') return true;
              if (tab === 'requested') return c.chat_status === 'open' && Number(c.inbound_count) > 0;
              // intervened tab
              return c.chat_status === 'intervened';
            })
            .map((c) => {
            // Local state is primary (SSE-driven); DB subquery is fallback for page-refresh
            const unread = unreadCounts[c.id] !== undefined ? unreadCounts[c.id] : (Number(c.unread_count) || 0);
            const isResolved = c.chat_status === 'resolved';
            const initial = (c.name || c.phone).charAt(0).toUpperCase();
            const avatarColors = ['bg-orange-400','bg-purple-500','bg-blue-500','bg-green-500','bg-red-400'];
            const color = avatarColors[initial.charCodeAt(0) % avatarColors.length];
            return (
              <button key={c.id} onClick={() => selectContact(c)}
                className={`w-full text-left px-3 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-center gap-3
                  ${selected?.id === c.id ? 'bg-green-50 border-l-2 border-l-whatsapp-green' : ''}
                  ${isResolved ? 'opacity-60' : ''}`}>
                <div className={`w-10 h-10 rounded-full ${color} text-white flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {c.name || c.phone}
                    </p>
                    {c.last_message_at && (
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {toLocalDate(c.last_message_at!).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={`text-xs truncate ${unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                      {isResolved ? <span className="text-green-600 font-medium">Resolved</span> : `+${c.phone}`}
                    </p>
                    {unread > 0 && !isResolved && (
                      <span className="flex-shrink-0 bg-whatsapp-green text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Middle: Chat area ───────────────────────────────── */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 bg-white">
            <div className="w-9 h-9 rounded-full bg-whatsapp-green text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {(selected.name || selected.phone).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900">{selected.name || selected.phone}</p>
              <p className="text-xs text-gray-400">+{selected.phone}</p>
            </div>
            {selected.chat_status === 'intervened' && (
              <div className="flex items-center gap-2">
                {/* Transfer dropdown */}
                <div className="relative" ref={transferRef}>
                  <button onClick={openTransfer} disabled={actioning || transferring}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                    {transferring ? <Loader2 size={12} className="animate-spin" /> : <ArrowRightLeft size={12} />}
                    Transfer
                    <ChevronDown size={11} className={`transition-transform duration-150 ${showTransfer ? 'rotate-180' : ''}`} />
                  </button>
                  {showTransfer && (
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                      <p className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">Transfer to</p>
                      {loadingAgents ? (
                        <div className="flex items-center justify-center py-5">
                          <Loader2 size={16} className="animate-spin text-gray-400" />
                        </div>
                      ) : transferAgents.length === 0 ? (
                        <p className="px-3 py-4 text-xs text-gray-400 text-center">No agents available</p>
                      ) : (
                        <div className="max-h-48 overflow-y-auto">
                          {transferAgents.map((a) => (
                            <button key={a.id} onClick={() => transferChat(a)}
                              className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center gap-2.5 transition-colors border-b border-gray-50 last:border-0">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {a.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate">{a.name}</p>
                                <p className="text-xs text-gray-400 capitalize">{a.workspace_role}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Resolve button */}
                <button onClick={resolve} disabled={actioning}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                  {actioning ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                  Resolve
                </button>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#f0f0f0]" ref={chatRef}
            style={{ backgroundImage: 'radial-gradient(circle, #d4d4d4 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            {messages.map((m, idx) => {
              const tpl      = parseTemplateContent(m.content);
              const media    = parseMediaContent(m.content);
              const location = parseLocationContent(m.content);
              const contacts = parseContactsContent(m.content);
              const repliedMsg = m.replied_to_wamid ? messages.find((x) => x.wamid === m.replied_to_wamid) : null;
              const msgDate  = toLocalDate(m.created_at);
              const timeStr  = msgDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });

              // Date separator logic — use en-CA locale for reliable YYYY-MM-DD strings
              const prevDate        = idx > 0 ? toLocalDate(messages[idx - 1].created_at) : null;
              const todayStr        = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
              const yesterdayStr    = new Date(Date.now() - 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
              const msgDateStr      = msgDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
              const prevDateStr     = prevDate ? prevDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : null;
              const isNewDay        = !prevDateStr || msgDateStr !== prevDateStr;
              const dateLabel       = msgDateStr === todayStr     ? 'Today'
                                    : msgDateStr === yesterdayStr ? 'Yesterday'
                                    : msgDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

              // Session divider — shown when a new regular message follows a "Closed by" event
              const prevMsg       = idx > 0 ? messages[idx - 1] : null;
              const isNewSession  = !!(prevMsg?.content?.startsWith('Closed by '));

              // System message — centered badge
              const isSystemMsg = m.type === 'system' ||
                (m.content?.startsWith('Intervened by ') || m.content?.startsWith('Closed by ') ||
                 m.content?.startsWith('Reopened by ')   || m.content?.startsWith('Transferred to '));
              if (isSystemMsg) {
                return (
                  <div key={m.id}>
                    {isNewDay && (
                      <div className="flex items-center justify-center my-3">
                        <span className="bg-white/80 text-gray-500 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                          {dateLabel}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-center my-2">
                      <span className="bg-gray-200/80 text-gray-500 text-xs px-4 py-1.5 rounded-full shadow-sm">
                        {m.content}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={m.id}>
                  {isNewSession && (
                    <div className="flex items-center gap-2 my-4">
                      <div className="flex-1 h-px bg-gray-300" />
                      <span className="text-xs text-gray-400 font-medium px-2 whitespace-nowrap">New Conversation</span>
                      <div className="flex-1 h-px bg-gray-300" />
                    </div>
                  )}
                  {isNewDay && (
                    <div className="flex items-center justify-center my-3">
                      <span className="bg-white/80 text-gray-500 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                        {dateLabel}
                      </span>
                    </div>
                  )}
                <div id={`msg-${m.wamid}`}
                  className={`flex transition-all ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                  {tpl ? (
                    <TemplateBubble data={tpl} status={m.status} time={timeStr} />
                  ) : (
                    <div className={`max-w-xs lg:max-w-sm rounded-2xl text-sm shadow-sm overflow-hidden
                      ${m.direction === 'outbound'
                        ? 'bg-[#dcf8c6] text-gray-800 rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm'}`}>

                      {/* Reply reference — with linked message or fallback to last template */}
                      {m.type === 'button' && (() => {
                        const quotedMsg = repliedMsg || messages.slice().reverse().find(
                          (x) => x.direction === 'outbound' && x.type === 'template' && x.id < m.id
                        );
                        const quotedTpl = quotedMsg ? parseTemplateContent(quotedMsg.content) : null;
                        return (
                          <button
                            onClick={() => quotedMsg?.wamid && scrollToReplied(quotedMsg.wamid)}
                            className="w-full text-left bg-black/10 border-l-4 border-whatsapp-green px-3 py-2 hover:bg-black/15 transition-colors">
                            <p className="text-whatsapp-teal font-semibold text-xs flex items-center gap-1 mb-0.5">
                              ↩ Replied to this message
                            </p>
                            <p className="text-gray-600 text-xs truncate">
                              {quotedTpl?.body?.slice(0, 55) || quotedMsg?.content?.slice(0, 55) || 'Template message'}
                              {((quotedTpl?.body?.length || 0) > 55) && '…'}
                            </p>
                          </button>
                        );
                      })()}

                      <div className="px-3 py-2">
                        {media ? (
                          <MediaBubble data={media} msgType={m.type} />
                        ) : location ? (
                          <LocationBubble data={location} />
                        ) : contacts ? (
                          <ContactsBubble data={contacts} />
                        ) : (
                          <p className="break-words whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        )}
                        <p className={`text-xs mt-1 flex items-center gap-0.5 ${m.direction === 'outbound' ? 'justify-end text-gray-400' : 'text-gray-300'}`}>
                          {timeStr}
                          {m.direction === 'outbound' && (
                            <span className={m.status === 'read' ? 'text-blue-500' : 'text-gray-400'}>
                              {m.status === 'read' || m.status === 'delivered' ? ' ✓✓' : ' ✓'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Template picker panel */}
          {showTemplates && (
            <div className="border-t border-gray-200 bg-white">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">Select a Template</p>
                <button onClick={() => setShowTemplates(false)}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
                {templates.length === 0
                  ? <p className="text-center text-xs text-gray-400 py-6">No approved templates</p>
                  : templates.map((t) => (
                    <button key={t.id} onClick={() => sendTemplate(t.name, t.language, t.id)}
                      disabled={sendingTpl === t.id}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                        {sendingTpl === t.id
                          ? <Loader2 size={14} className="animate-spin text-gray-400" />
                          : <Send size={13} className="text-gray-300" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{t.body_text}</p>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Input / Intervene */}
          {selected.chat_status === 'intervened' ? (
            isSessionOpen ? (
              /* Session active — full text input */
              <div className="p-3 border-t border-gray-200 bg-white flex gap-2 items-center">
                <input value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..."
                  className="input flex-1 text-sm" />
                <button onClick={() => { loadTemplates(); setShowTemplates((v) => !v); }}
                  title="Send template"
                  className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
                  <LayoutTemplate size={16} />
                </button>
                <button onClick={sendMessage} disabled={sending || !text.trim()}
                  className="btn-primary px-4 py-2.5 disabled:opacity-50">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            ) : (
              /* Session expired — disabled input + template button */
              <div className="border-t border-gray-200 bg-white">
                <div className="flex items-center gap-1.5 px-3 pt-2 pb-1">
                  <Clock size={12} className="text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-600">24h session expired — waiting for user reply, or send a template</p>
                </div>
                <div className="p-2 flex gap-2 items-center">
                  <input disabled value=""
                    placeholder="Waiting for user reply…"
                    className="input flex-1 text-sm bg-gray-50 cursor-not-allowed text-gray-400" />
                  <button onClick={() => { loadTemplates(); setShowTemplates((v) => !v); }}
                    title="Send template"
                    className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors flex-shrink-0">
                    <LayoutTemplate size={16} />
                  </button>
                </div>
              </div>
            )
          ) : selected.chat_status === 'resolved' ? (
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col items-center gap-2">
              <p className="text-xs text-gray-400">Chat resolved — moves to History in 24 hrs</p>
              <button onClick={intervene} disabled={actioning}
                className="flex items-center gap-2 px-6 py-2.5 bg-whatsapp-green hover:bg-green-600 text-white font-semibold rounded-full text-sm transition-colors disabled:opacity-50 shadow-sm">
                {actioning ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />}
                Intervene Again
              </button>
            </div>
          ) : (
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-center">
              <button onClick={intervene} disabled={actioning}
                className="flex items-center gap-2 px-6 py-2.5 bg-whatsapp-green hover:bg-green-600 text-white font-semibold rounded-full text-sm transition-colors disabled:opacity-50 shadow-sm">
                {actioning ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />}
                Intervene
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
          <div className="text-center">
            <div className="text-5xl mb-3">💬</div>
            <p className="font-medium text-gray-500">Select a contact to start chatting</p>
            <p className="text-sm text-gray-400 mt-1">Choose from the contact list on the left</p>
          </div>
        </div>
      )}

      {/* ── Right: Profile Panel ────────────────────────────── */}
      {selected && (
        <ProfilePanel contact={selected} templateMsgCount={templateMsgCount} sessionMsgCount={sessionMsgCount} />
      )}
    </div>
  );
}
