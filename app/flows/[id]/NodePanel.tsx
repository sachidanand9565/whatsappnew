'use client';
import { useState } from 'react';
import { Node } from 'reactflow';
import { X, Trash2, Plus } from 'lucide-react';

interface Props {
  node: Node;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  onClose: () => void;
  triggerKeywords?: string[];
  onTriggerKeywordsChange?: (kw: string[]) => void;
}

// Shared dark input styling
const INPUT = 'w-full bg-[#0b1120] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40 transition-colors';
const LABEL = 'block text-xs font-medium text-slate-400 mb-1';

export default function NodePanel({ node, onUpdate, onDelete, onClose, triggerKeywords = [], onTriggerKeywordsChange }: Props) {
  const d = node.data;
  const [kwVal, setKwVal] = useState('');

  const handleAddKw = () => {
    const val = kwVal.trim().toLowerCase();
    if (!val) return;
    if (triggerKeywords.includes(val)) return;
    if (onTriggerKeywordsChange) {
      onTriggerKeywordsChange([...triggerKeywords, val]);
    }
    setKwVal('');
  };

  function field(label: string, key: string, type = 'text', placeholder = '') {
    return (
      <div key={key}>
        <label className={LABEL}>{label}</label>
        <input
          type={type}
          value={d[key] || ''}
          onChange={e => onUpdate({ [key]: e.target.value })}
          placeholder={placeholder}
          className={INPUT}
        />
      </div>
    );
  }

  function textarea(label: string, key: string, placeholder = '') {
    return (
      <div>
        <label className={LABEL}>{label}</label>
        <textarea
          value={d[key] || ''}
          onChange={e => onUpdate({ [key]: e.target.value })}
          placeholder={placeholder}
          rows={4}
          className={`${INPUT} resize-none`}
        />
      </div>
    );
  }

  function select(label: string, key: string, options: string[]) {
    return (
      <div>
        <label className={LABEL}>{label}</label>
        <select
          value={d[key] || options[0]}
          onChange={e => onUpdate({ [key]: e.target.value })}
          className={`${INPUT} [&>option]:bg-[#0f172a]`}
        >
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  function renderFields() {
    switch (node.type) {
      case 'start':
        return (
          <div className="space-y-4">
            <div className="bg-white/[0.04] border border-white/5 rounded-lg p-3 text-xs text-slate-400 leading-normal">
              Flow will trigger when a contact sends any of these keywords.
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Trigger Keywords</label>

              {/* Keywords Tag List */}
              <div className="flex flex-wrap gap-1.5 min-h-[40px] bg-[#0b1120] border border-white/10 rounded-lg p-2.5 mb-2.5">
                {triggerKeywords.length === 0 && (
                  <span className="text-xs text-slate-600 italic">No keywords configured yet.</span>
                )}
                {triggerKeywords.map((kw, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    {kw}
                    <button
                      onClick={() => {
                        if (onTriggerKeywordsChange) {
                          onTriggerKeywordsChange(triggerKeywords.filter((_, j) => j !== i));
                        }
                      }}
                      className="hover:text-red-400 font-bold ml-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Keyword Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={kwVal}
                  onChange={e => setKwVal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKw();
                    }
                  }}
                  placeholder="e.g. hello"
                  className={`flex-1 ${INPUT} !py-1.5 text-xs`}
                />
                <button
                  onClick={handleAddKw}
                  className="bg-sky-600 hover:bg-sky-500 text-white px-3 rounded-lg text-xs font-semibold flex items-center justify-center"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        );

      case 'message':
        return (
          <div className="space-y-4">
            {textarea('Message Text', 'text', 'Type your WhatsApp message here...\n\nUse {{contact.name}} for variables')}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Buttons (max 3)</label>
              {(d.buttons || []).map((btn: any, i: number) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    value={btn.text || ''}
                    onChange={e => {
                      const btns = [...(d.buttons || [])];
                      btns[i] = { ...btns[i], text: e.target.value };
                      onUpdate({ buttons: btns });
                    }}
                    placeholder={`Button ${i + 1} text`}
                    className={`flex-1 ${INPUT} !py-1.5`}
                  />
                  <button onClick={() => {
                    const btns = (d.buttons || []).filter((_: any, j: number) => j !== i);
                    onUpdate({ buttons: btns });
                  }} className="text-slate-500 hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {(d.buttons || []).length < 3 && (
                <button onClick={() => {
                  const btns = [...(d.buttons || []), { text: '' }];
                  onUpdate({ buttons: btns });
                }} className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-medium">
                  <Plus size={12} /> Add Button
                </button>
              )}
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            {field('Variable', 'variable', 'text', '{{contact.name}} or {{var.order_id}}')}
            {select('Operator', 'operator', ['equals', 'not_equals', 'contains', 'starts_with', 'is_empty', 'is_not_empty'])}
            {field('Value', 'value', 'text', 'Expected value')}
            <div className="bg-sky-500/10 border border-sky-500/15 rounded-lg p-3 text-xs text-sky-200 space-y-1">
              <p>✅ <strong>True</strong> → top right handle</p>
              <p>❌ <strong>False</strong> → bottom right handle</p>
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-4">
            {select('Method', 'method', ['GET', 'POST', 'PUT', 'DELETE'])}
            {field('URL', 'url', 'url', 'https://api.example.com/endpoint')}
            {textarea('Request Body (JSON)', 'body', '{"key": "{{contact.phone}}"}')}
            {field('Save Response As', 'save_as', 'text', 'order_status')}
            <p className="text-[10px] text-slate-500">
              Use <span className="font-mono text-violet-300">{'{{var.save_as}}'}</span> in next nodes to use response
            </p>
          </div>
        );

      case 'set_attr':
        return (
          <div className="space-y-4">
            {select('Attribute', 'attribute', ['name', 'email', 'city', 'tags', 'status', 'notes'])}
            {field('Value', 'value', 'text', 'Value or {{contact.name}}')}
          </div>
        );

      case 'ask_question':
        return (
          <div className="space-y-4">
            {textarea('Question', 'question', 'What is your name?')}
            {field('Save Reply As', 'save_as', 'text', 'user_name')}
            {select('Validation', 'validation', ['any', 'number', 'email', 'phone'])}
            <p className="text-[10px] text-slate-500">Use <span className="font-mono text-cyan-300">{'{{var.save_as}}'}</span> in next nodes</p>
          </div>
        );

      case 'send_media':
        return (
          <div className="space-y-4">
            {select('Media Type', 'media_type', ['image', 'video', 'document', 'audio'])}
            {field('Media URL', 'url', 'url', 'https://example.com/image.jpg')}
            {textarea('Caption (optional)', 'caption', 'Caption text...')}
          </div>
        );

      case 'list_message':
        return (
          <div className="space-y-4">
            {textarea('Body Text', 'body', 'Please select an option:')}
            {field('Button Text', 'button_text', 'text', 'Choose Option')}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Sections & Items</label>
              {(d.sections || []).map((sec: any, i: number) => (
                <div key={i} className="border border-white/10 rounded-lg p-2 mb-2 space-y-2 bg-white/[0.02]">
                  <div className="flex gap-2">
                    <input value={sec.title || ''} placeholder="Section title"
                      onChange={e => { const s = [...(d.sections||[])]; s[i]={...s[i],title:e.target.value}; onUpdate({sections:s}); }}
                      className={`flex-1 ${INPUT} !px-2 !py-1 text-xs font-semibold`} />
                    <button onClick={() => onUpdate({sections:(d.sections||[]).filter((_:any,j:number)=>j!==i)})}
                      className="text-red-400 hover:text-red-300"><X size={12}/></button>
                  </div>
                  {/* Section Rows (Items) */}
                  <div className="pl-3 space-y-1.5 border-l-2 border-teal-500/30">
                    {(sec.rows || []).map((row: any, ri: number) => (
                      <div key={ri} className="flex gap-1.5 items-center">
                        <input value={row.title || ''} placeholder="Item title"
                          onChange={e => {
                            const s = [...(d.sections||[])];
                            const r = [...(s[i].rows || [])];
                            r[ri] = { ...r[ri], title: e.target.value };
                            s[i] = { ...s[i], rows: r };
                            onUpdate({ sections: s });
                          }}
                          className={`flex-1 ${INPUT} !px-2 !py-0.5 text-[10px]`} />
                        <input value={row.description || ''} placeholder="Desc (opt)"
                          onChange={e => {
                            const s = [...(d.sections||[])];
                            const r = [...(s[i].rows || [])];
                            r[ri] = { ...r[ri], description: e.target.value };
                            s[i] = { ...s[i], rows: r };
                            onUpdate({ sections: s });
                          }}
                          className={`flex-1 ${INPUT} !px-2 !py-0.5 text-[10px]`} />
                        <button onClick={() => {
                          const s = [...(d.sections||[])];
                          s[i] = { ...s[i], rows: (s[i].rows || []).filter((_: any, rj: number) => rj !== ri) };
                          onUpdate({ sections: s });
                        }} className="text-slate-500 hover:text-red-400 shrink-0">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => {
                      const s = [...(d.sections||[])];
                      s[i] = { ...s[i], rows: [...(s[i].rows || []), { title: '', description: '' }] };
                      onUpdate({ sections: s });
                    }} className="text-[10px] text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-0.5">
                      <Plus size={10} /> Add Item
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => onUpdate({sections:[...(d.sections||[]),{title:'',rows:[]}]})}
                className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 font-medium">
                <Plus size={12}/> Add Section
              </button>
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-4">
            <div>
              <label className={LABEL}>Duration</label>
              <input type="number" min={1} value={d.duration || 5}
                onChange={e => onUpdate({ duration: parseInt(e.target.value) })}
                className={INPUT} />
            </div>
            {select('Unit', 'unit', ['seconds', 'minutes', 'hours'])}
          </div>
        );

      case 'add_tag':
        return (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-400">Tags</label>
            <div className="flex flex-wrap gap-1 min-h-[36px] bg-[#0b1120] border border-white/10 rounded-lg p-2">
              {(d.tags||[]).map((t: string, i: number) => (
                <span key={i} className="flex items-center gap-1 bg-orange-500/15 text-orange-300 text-xs px-2 py-0.5 rounded-full">
                  {t}
                  <button onClick={() => onUpdate({tags:(d.tags||[]).filter((_:any,j:number)=>j!==i)})} className="hover:text-red-400"><X size={10}/></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input id="tag_input" placeholder="Add tag and press Enter" onKeyDown={e => {
                if(e.key==='Enter') {
                  const v=(e.target as HTMLInputElement).value.trim();
                  if(v){ onUpdate({tags:[...(d.tags||[]),v]}); (e.target as HTMLInputElement).value=''; }
                }
              }} className={`flex-1 ${INPUT} !py-1.5 text-xs`} />
            </div>
          </div>
        );

      case 'transfer_agent':
        return (
          <div className="space-y-4">
            {textarea('Message to user', 'message', 'Connecting you to an agent...')}
          </div>
        );

      case 'connect_flow':
        return (
          <div className="space-y-4">
            {field('Flow Name', 'flow_name', 'text', 'Enter flow name to connect')}
            <div className="bg-lime-500/10 border border-lime-500/15 rounded-lg p-3 text-xs text-lime-200">
              Flow ki ID Settings mein set karein. Yeh node selected flow ko trigger karega.
            </div>
          </div>
        );

      case 'end':
        return (
          <div className="bg-red-500/10 border border-red-500/15 rounded-lg p-3 text-xs text-red-300">
            Flow ends here. User&apos;s session will be cleared.
          </div>
        );

      default:
        return null;
    }
  }

  const TYPE_ACCENT: Record<string, string> = {
    start: '#22c55e', message: '#3b82f6', condition: '#a855f7', api: '#8b5cf6',
    set_attr: '#f59e0b', end: '#ef4444', ask_question: '#06b6d4', send_media: '#ec4899',
    list_message: '#14b8a6', delay: '#94a3b8', add_tag: '#f97316', transfer_agent: '#6366f1',
    connect_flow: '#84cc16',
  };
  const accent = TYPE_ACCENT[node.type || ''] || '#64748b';

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#0f172a]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: accent }} />
          <span className="text-slate-100 font-bold text-sm capitalize truncate">
            {node.type?.replace('_', ' ')} Settings
          </span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {field('Node Label', 'label', 'text', 'Node name')}
        <hr className="border-white/[0.06]" />
        {renderFields()}
      </div>

      {/* Delete */}
      {node.id !== 'start' && (
        <div className="p-4 border-t border-white/[0.07]">
          <button onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 py-2 rounded-lg text-sm font-medium transition-colors">
            <Trash2 size={14} /> Delete Node
          </button>
        </div>
      )}
    </div>
  );
}
