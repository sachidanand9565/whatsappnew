import { Handle, Position, NodeProps } from 'reactflow';
import { List } from 'lucide-react';
import NodeShell, { HANDLE_CLASS, CANVAS_BG } from './NodeShell';

export default function ListMessageNode({ data, selected }: NodeProps) {
  const sections = data.sections || [];
  const hasItems = sections.some((s: { rows?: unknown[] }) => s.rows && s.rows.length > 0);

  return (
    <NodeShell icon={<List size={15} />} title="List Message" accent="#14b8a6" selected={selected} width={232} hasSource={!hasItems}>
      <p className="text-slate-300 line-clamp-2">
        {data.body || <span className="text-slate-500 italic">Click to add body…</span>}
      </p>

      {sections.map((sec: { title?: string; rows?: { title?: string }[] }, sIdx: number) => {
        const rows = sec.rows || [];
        if (rows.length === 0) return null;
        return (
          <div key={sIdx} className="space-y-1 mt-2">
            <p className="text-[8px] font-bold text-teal-300 uppercase tracking-wider">{sec.title || `Section ${sIdx + 1}`}</p>
            {rows.map((row, rIdx: number) => (
              <div key={rIdx} className="relative text-[10px] border border-teal-400/30 text-teal-200 bg-teal-500/10 rounded-lg px-2 py-1 text-center font-medium">
                {row.title || `Item ${rIdx + 1}`}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`list-${sIdx}-${rIdx}`}
                  style={{ right: -17, top: '50%', transform: 'translateY(-50%)', background: '#14b8a6', borderColor: CANVAS_BG }}
                  className={HANDLE_CLASS}
                />
              </div>
            ))}
          </div>
        );
      })}
    </NodeShell>
  );
}
