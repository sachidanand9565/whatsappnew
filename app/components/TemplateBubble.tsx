/**
 * TemplateBubble — renders a sent WhatsApp template message the same way the
 * Inbox does: media-header chip + body + footer + stacked quick-reply buttons.
 * Reusable in any chat surface (campaign chat drawer, history, inbox).
 */
import { Image, FileVideo, File, FileText } from 'lucide-react';

export interface TemplateContent {
  __type: 'template';
  template_name?: string;
  header_type: string;
  header_content: string;
  body: string;
  footer?: string;
  buttons: { type?: string; text: string }[];
}

export function parseTemplateContent(content: string | null | undefined): TemplateContent | null {
  if (!content) return null;
  try {
    const p = JSON.parse(content);
    if (p?.__type === 'template') return p as TemplateContent;
  } catch { /* not a template */ }
  return null;
}

export default function TemplateBubble({ data, status, time }: { data: TemplateContent; status: string; time: string }) {
  const HeaderIcon = data.header_type === 'IMAGE' ? Image
    : data.header_type === 'VIDEO'    ? FileVideo
    : data.header_type === 'DOCUMENT' ? File : FileText;

  return (
    <div className="flex flex-col items-end">
      {/* Main bubble card */}
      <div className="w-72 rounded-2xl rounded-br-none overflow-hidden shadow-md border border-emerald-100/50 bg-[#d9fdd3] text-slate-800">
        {data.header_type && data.header_type !== 'NONE' && (
          <div className="px-4 pt-3 pb-1.5 border-b border-emerald-200/20">
            {data.header_type === 'TEXT' ? (
              <p className="font-bold text-slate-900 text-sm">{data.header_content}</p>
            ) : (
              <div className="flex items-center gap-2 text-slate-600 text-sm">
                <HeaderIcon size={15} className="text-emerald-600" />
                <span className="font-semibold tracking-wider text-xs uppercase">{data.header_type}</span>
              </div>
            )}
          </div>
        )}
        <div className="px-4 py-3">
          <p className="text-sm text-slate-800 whitespace-pre-wrap break-words leading-relaxed">{data.body}</p>
          {data.footer && <p className="text-[10px] text-slate-500 mt-2 font-medium">{data.footer}</p>}
          <p className="text-[10px] text-slate-500 text-right mt-1.5 flex items-center justify-end gap-0.5">
            {time}
            <span className={status === 'read' ? 'text-sky-500' : 'text-slate-400'}>
              {status === 'read' || status === 'delivered' ? ' ✓✓' : ' ✓'}
            </span>
          </p>
        </div>
      </div>

      {/* Stacked quick reply buttons below the bubble */}
      {data.buttons?.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1.5 w-72">
          {data.buttons.map((btn, i) => (
            <div key={i}
              className="bg-white text-emerald-600 font-semibold text-xs py-2 px-4 rounded-xl shadow-sm text-center border border-slate-100/80 cursor-default">
              {btn.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
