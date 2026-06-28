'use client';
/**
 * TemplateComposer — the same approved-template sender used in the Inbox,
 * reusable in any chat surface (campaign chat drawer, history chat, etc.).
 * Supports body variables, media headers (Image/Video/Document) via upload OR URL,
 * and a live preview. Buttons are part of the approved template, so they're sent
 * automatically by Meta — no extra handling needed here.
 */
import { useEffect, useState } from 'react';
import { apiFetch } from '@/hooks/useApi';
import toast from 'react-hot-toast';
import { X, ArrowLeft, Upload, Link as LinkIcon, Eye, Send, Loader2 } from 'lucide-react';

type Tpl = {
  id: number; name: string; language: string; body_text: string;
  status: string; header_type: string; header_content: string;
};

function extractVarCount(body: string): number {
  const nums = (body?.match(/\{\{(\d+)\}\}/g) || []).map(m => parseInt(m.replace(/\{\{|\}\}/g, '')));
  return nums.length > 0 ? Math.max(...nums) : 0;
}
function applyTplParams(body: string, params: string[]): string {
  return (body || '').replace(/\{\{(\d+)\}\}/g, (_, n) => params[Number(n) - 1] || `{{${n}}}`);
}
function renderTplPreview(text: string): React.ReactNode {
  return text.split('\n').map((line, li, arr) => {
    const parts: React.ReactNode[] = [];
    const re = /(\*[^*\n]+\*|_[^_\n]+_)/g;
    let last = 0, k = 0, m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      const raw = m[0], inner = raw.slice(1, -1);
      parts.push(raw[0] === '*' ? <strong key={k++}>{inner}</strong> : <em key={k++}>{inner}</em>);
      last = m.index + raw.length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return <span key={li}>{parts}{li < arr.length - 1 && <br />}</span>;
  });
}

export default function TemplateComposer({
  contactId, onSent, onClose,
}: {
  contactId: number;
  onSent?: () => void;
  onClose: () => void;
}) {
  const [templates, setTemplates] = useState<Tpl[]>([]);
  const [tplForParams, setTplForParams] = useState<Tpl | null>(null);
  const [tplParamVals, setTplParamVals] = useState<string[]>([]);
  const [tplHeaderMode, setTplHeaderMode] = useState<'upload' | 'url'>('upload');
  const [tplHeaderMediaId, setTplHeaderMediaId] = useState('');
  const [tplHeaderMediaUrl, setTplHeaderMediaUrl] = useState('');
  const [tplHeaderFileName, setTplHeaderFileName] = useState('');
  const [uploadingTplHeader, setUploadingTplHeader] = useState(false);
  const [sendingTpl, setSendingTpl] = useState<number | null>(null);

  useEffect(() => {
    apiFetch('/api/templates')
      .then(r => setTemplates((r.data || []).filter((t: Tpl) => (t.status || '').toUpperCase() === 'APPROVED')))
      .catch(() => {});
  }, []);

  function resetParams() {
    setTplForParams(null); setTplHeaderMediaId(''); setTplHeaderMediaUrl(''); setTplHeaderFileName('');
  }

  async function uploadTplHeaderFile(file: File) {
    setUploadingTplHeader(true);
    const toastId = toast.loading(`Uploading ${file.name}…`);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('token');
      const upRes = await fetch('/api/media', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error || 'Upload failed');
      setTplHeaderMediaId(upData.data.mediaId);
      setTplHeaderFileName(file.name);
      toast.success('Uploaded!', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed', { id: toastId });
    } finally {
      setUploadingTplHeader(false);
    }
  }

  async function sendTemplate(t: Tpl, params: string[] = []) {
    const isMediaHeader = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(t.header_type);
    if (isMediaHeader && !tplHeaderMediaId && !tplHeaderMediaUrl.trim()) {
      toast.error('Please upload a file or enter a URL for the header media');
      return;
    }
    setSendingTpl(t.id);
    try {
      const components: object[] = [];
      if (isMediaHeader) {
        const mediaType = t.header_type.toLowerCase();
        components.push({
          type: 'header',
          parameters: [{ type: mediaType, [mediaType]: tplHeaderMediaId ? { id: tplHeaderMediaId } : { link: tplHeaderMediaUrl.trim() } }],
        });
      }
      if (params.length > 0) {
        components.push({ type: 'body', parameters: params.map((val) => ({ type: 'text', text: String(val) })) });
      }
      await apiFetch('/api/send-message', {
        method: 'POST',
        body: JSON.stringify({
          contactId, type: 'template', templateName: t.name, language: t.language,
          templateParams: params,
          ...(components.length > 0 ? { components } : {}),
        }),
      });
      resetParams();
      setTplParamVals([]);
      onSent?.();
      onClose();
      toast.success('Template sent!');
    } catch (err) {
      toast.error('Failed: ' + (err instanceof Error ? err.message : 'error'));
    } finally {
      setSendingTpl(null);
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white">
      {tplForParams ? (
        /* ── Params form ── */
        <>
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <button onClick={resetParams} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={15} /></button>
              <p className="text-sm font-semibold text-gray-700">Parameters</p>
            </div>
            <button onClick={() => { resetParams(); onClose(); }}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>
          </div>
          <div className="overflow-y-auto max-h-72 p-4 space-y-3">
            {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(tplForParams.header_type) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-600">
                    Header {tplForParams.header_type.charAt(0) + tplForParams.header_type.slice(1).toLowerCase()} (required)
                  </p>
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button onClick={() => setTplHeaderMode('upload')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 ${tplHeaderMode === 'upload' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>
                      <Upload size={11} /> Upload
                    </button>
                    <button onClick={() => setTplHeaderMode('url')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 ${tplHeaderMode === 'url' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>
                      <LinkIcon size={11} /> URL
                    </button>
                  </div>
                </div>
                {tplHeaderMode === 'upload' ? (
                  <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="file" className="hidden"
                      accept={tplForParams.header_type === 'IMAGE' ? 'image/*' : tplForParams.header_type === 'VIDEO' ? 'video/*' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'}
                      onChange={e => { const file = e.target.files?.[0]; if (file) uploadTplHeaderFile(file); }}
                    />
                    {uploadingTplHeader ? <Loader2 size={14} className="animate-spin text-gray-400" /> : <Upload size={14} className="text-gray-400" />}
                    <span className="text-xs text-gray-500 truncate">
                      {uploadingTplHeader ? 'Uploading…' : tplHeaderFileName ? `✓ ${tplHeaderFileName}` : `Choose ${tplForParams.header_type.toLowerCase()} file`}
                    </span>
                  </label>
                ) : (
                  <input value={tplHeaderMediaUrl}
                    onChange={e => { setTplHeaderMediaUrl(e.target.value); setTplHeaderMediaId(''); setTplHeaderFileName(''); }}
                    placeholder={`https://example.com/file.${tplForParams.header_type === 'IMAGE' ? 'jpg' : tplForParams.header_type === 'VIDEO' ? 'mp4' : 'pdf'}`}
                    className="input text-sm py-1.5 w-full"
                  />
                )}
              </div>
            )}
            {tplParamVals.map((val, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-500 w-12 shrink-0 text-right">{`{{${i + 1}}}`}</span>
                <input value={val}
                  onChange={e => { const next = [...tplParamVals]; next[i] = e.target.value; setTplParamVals(next); }}
                  placeholder="value" className="input text-sm py-1.5 flex-1"
                />
              </div>
            ))}
            <div className="border-t pt-3 mt-1">
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-2"><Eye size={12} /> Preview</p>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl rounded-br-none px-3 py-2 text-sm text-slate-800 leading-snug whitespace-pre-wrap shadow-sm">
                {renderTplPreview(applyTplParams(tplForParams.body_text, tplParamVals))}
              </div>
            </div>
          </div>
          <div className="px-4 py-2.5 border-t flex gap-2">
            <button onClick={resetParams} className="btn-secondary flex-1 text-sm">Back</button>
            <button onClick={() => sendTemplate(tplForParams, tplParamVals)}
              disabled={sendingTpl === tplForParams.id || uploadingTplHeader}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {sendingTpl === tplForParams.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send
            </button>
          </div>
        </>
      ) : (
        /* ── Template list ── */
        <>
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Select a Template</p>
            <button onClick={onClose}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>
          </div>
          <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
            {templates.length === 0
              ? <p className="text-center text-xs text-gray-400 py-6">No approved templates</p>
              : templates.map((t) => {
                  const varCount = extractVarCount(t.body_text);
                  const hasMediaHeader = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(t.header_type);
                  return (
                    <button key={t.id}
                      onClick={() => {
                        if (varCount > 0 || hasMediaHeader) {
                          setTplForParams(t);
                          setTplParamVals(Array(varCount).fill(''));
                          setTplHeaderMediaId(''); setTplHeaderMediaUrl(''); setTplHeaderFileName(''); setTplHeaderMode('upload');
                        } else {
                          sendTemplate(t);
                        }
                      }}
                      disabled={sendingTpl === t.id}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                        {sendingTpl === t.id
                          ? <Loader2 size={14} className="animate-spin text-gray-400" />
                          : varCount > 0
                            ? <span className="text-[10px] text-blue-400 font-medium">{varCount} vars</span>
                            : hasMediaHeader
                              ? <span className="text-[10px] text-blue-400 font-medium">{t.header_type.toLowerCase()}</span>
                              : <Send size={13} className="text-gray-300" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{t.body_text}</p>
                    </button>
                  );
                })}
          </div>
        </>
      )}
    </div>
  );
}
