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
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <input
          type={type}
          value={d[key] || ''}
          onChange={e => onUpdate({ [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
        />
      </div>
    );
  }

  function textarea(label: string, key: string, placeholder = '') {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <textarea
          value={d[key] || ''}
          onChange={e => onUpdate({ [key]: e.target.value })}
          placeholder={placeholder}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green resize-none"
        />
      </div>
    );
  }

  function select(label: string, key: string, options: string[]) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <select
          value={d[key] || options[0]}
          onChange={e => onUpdate({ [key]: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
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
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 leading-normal">
              Flow will trigger when a contact sends any of these keywords.
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Trigger Keywords
              </label>
              
              {/* Keywords Tag List */}
              <div className="flex flex-wrap gap-1.5 min-h-[40px] bg-gray-50 border border-gray-200 rounded-lg p-2.5 mb-2.5">
                {triggerKeywords.length === 0 && (
                  <span className="text-xs text-gray-405 italic">No keywords configured yet.</span>
                )}
                {triggerKeywords.map((kw, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-100/80">
                    {kw}
                    <button
                      onClick={() => {
                        if (onTriggerKeywordsChange) {
                          onTriggerKeywordsChange(triggerKeywords.filter((_, j) => j !== i));
                        }
                      }}
                      className="hover:text-red-500 font-bold ml-0.5"
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
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
                />
                <button
                  onClick={handleAddKw}
                  className="bg-whatsapp-green hover:bg-green-700 text-white px-3 rounded-lg text-xs font-semibold flex items-center justify-center"
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
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Buttons (max 3)
              </label>
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
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
                  />
                  <button onClick={() => {
                    const btns = (d.buttons || []).filter((_: any, j: number) => j !== i);
                    onUpdate({ buttons: btns });
                  }} className="text-gray-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {(d.buttons || []).length < 3 && (
                <button onClick={() => {
                  const btns = [...(d.buttons || []), { text: '' }];
                  onUpdate({ buttons: btns });
                }} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
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
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 space-y-1">
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
            <p className="text-[10px] text-gray-400">
              Use <span className="font-mono">{'{{var.save_as}}'}</span> in next nodes to use response
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
            <p className="text-[10px] text-gray-400">Use <span className="font-mono">{'{{var.save_as}}'}</span> in next nodes</p>
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
              <label className="block text-xs font-medium text-gray-600 mb-2">Sections & Items</label>
              {(d.sections || []).map((sec: any, i: number) => (
                <div key={i} className="border border-gray-200 rounded-lg p-2 mb-2 space-y-2">
                  <div className="flex gap-2">
                    <input value={sec.title || ''} placeholder="Section title"
                      onChange={e => { const s = [...(d.sections||[])]; s[i]={...s[i],title:e.target.value}; onUpdate({sections:s}); }}
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs font-semibold" />
                    <button onClick={() => onUpdate({sections:(d.sections||[]).filter((_:any,j:number)=>j!==i)})}
                      className="text-red-400 hover:text-red-600"><X size={12}/></button>
                  </div>
                  {/* Section Rows (Items) */}
                  <div className="pl-3 space-y-1.5 border-l-2 border-teal-100">
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
                          className="flex-1 border border-gray-200 rounded px-2 py-0.5 text-[10px]" />
                        <input value={row.description || ''} placeholder="Desc (opt)"
                          onChange={e => {
                            const s = [...(d.sections||[])];
                            const r = [...(s[i].rows || [])];
                            r[ri] = { ...r[ri], description: e.target.value };
                            s[i] = { ...s[i], rows: r };
                            onUpdate({ sections: s });
                          }}
                          className="flex-1 border border-gray-200 rounded px-2 py-0.5 text-[10px]" />
                        <button onClick={() => {
                          const s = [...(d.sections||[])];
                          s[i] = { ...s[i], rows: (s[i].rows || []).filter((_: any, rj: number) => rj !== ri) };
                          onUpdate({ sections: s });
                        }} className="text-gray-400 hover:text-red-500 shrink-0">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => {
                      const s = [...(d.sections||[])];
                      s[i] = { ...s[i], rows: [...(s[i].rows || []), { title: '', description: '' }] };
                      onUpdate({ sections: s });
                    }} className="text-[10px] text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-0.5">
                      <Plus size={10} /> Add Item
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => onUpdate({sections:[...(d.sections||[]),{title:'',rows:[]}]})}
                className="flex items-center gap-1 text-xs text-teal-600 font-medium">
                <Plus size={12}/> Add Section
              </button>
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
              <input type="number" min={1} value={d.duration || 5}
                onChange={e => onUpdate({ duration: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green" />
            </div>
            {select('Unit', 'unit', ['seconds', 'minutes', 'hours'])}
          </div>
        );

      case 'add_tag':
        return (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-gray-600">Tags</label>
            <div className="flex flex-wrap gap-1 min-h-[36px] bg-gray-50 rounded-lg p-2">
              {(d.tags||[]).map((t: string, i: number) => (
                <span key={i} className="flex items-center gap-1 bg-orange-50 text-orange-600 text-xs px-2 py-0.5 rounded-full">
                  {t}
                  <button onClick={() => onUpdate({tags:(d.tags||[]).filter((_:any,j:number)=>j!==i)})}><X size={10}/></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input id="tag_input" placeholder="Add tag" onKeyDown={e => {
                if(e.key==='Enter') {
                  const v=(e.target as HTMLInputElement).value.trim();
                  if(v){ onUpdate({tags:[...(d.tags||[]),v]}); (e.target as HTMLInputElement).value=''; }
                }
              }} className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-whatsapp-green" />
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
            <div className="bg-lime-50 rounded-lg p-3 text-xs text-lime-700">
              Flow ki ID Settings mein set karein. Yeh node selected flow ko trigger karega.
            </div>
          </div>
        );

      case 'end':
        return (
          <div className="bg-red-50 rounded-lg p-3 text-xs text-red-600">
            Flow ends here. User's session will be cleared.
          </div>
        );

      default:
        return null;
    }
  }

  const TYPE_COLORS: Record<string, string> = {
    start:          'bg-green-500',
    message:        'bg-blue-500',
    condition:      'bg-purple-500',
    api:            'bg-violet-500',
    set_attr:       'bg-yellow-500',
    end:            'bg-red-500',
    ask_question:   'bg-cyan-500',
    send_media:     'bg-pink-500',
    list_message:   'bg-teal-500',
    delay:          'bg-slate-500',
    add_tag:        'bg-orange-500',
    transfer_agent: 'bg-indigo-500',
    connect_flow:   'bg-lime-500',
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`${TYPE_COLORS[node.type || ''] || 'bg-gray-500'} px-4 py-3 flex items-center justify-between`}>
        <span className="text-white font-bold text-sm capitalize">
          {node.type?.replace('_', ' ')} Settings
        </span>
        <button onClick={onClose} className="text-white/70 hover:text-white">
          <X size={16} />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {field('Node Label', 'label', 'text', 'Node name')}
        <hr className="border-gray-100" />
        {renderFields()}
      </div>

      {/* Delete */}
      {node.id !== 'start' && (
        <div className="p-4 border-t border-gray-100">
          <button onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 py-2 rounded-lg text-sm font-medium transition-colors">
            <Trash2 size={14} /> Delete Node
          </button>
        </div>
      )}
    </div>
  );
}
