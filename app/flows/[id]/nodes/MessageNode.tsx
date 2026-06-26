import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare } from 'lucide-react';
import NodeShell, { HANDLE_CLASS, CANVAS_BG } from './NodeShell';

export default function MessageNode({ data, selected }: NodeProps) {
  const hasButtons = data.buttons && data.buttons.length > 0;

  return (
    <NodeShell icon={<MessageSquare size={15} />} title="Message" accent="#3b82f6" selected={selected} width={232} hasSource={!hasButtons}>
      {data.text ? (
        <p className="text-slate-300 line-clamp-3">{data.text}</p>
      ) : (
        <span className="text-slate-500 italic">Click to add message…</span>
      )}
      {hasButtons && (
        <div className="space-y-1.5 pt-2">
          {data.buttons.slice(0, 3).map((btn: { text?: string }, i: number) => (
            <div key={i} className="relative text-[10px] border border-blue-400/30 text-blue-300 rounded-lg px-2 py-1 text-center font-medium bg-blue-500/10">
              {btn.text || `Button ${i + 1}`}
              <Handle
                type="source"
                position={Position.Right}
                id={`btn-${i}`}
                style={{ right: -17, top: '50%', transform: 'translateY(-50%)', background: '#3b82f6', borderColor: CANVAS_BG }}
                className={HANDLE_CLASS}
              />
            </div>
          ))}
        </div>
      )}
    </NodeShell>
  );
}
