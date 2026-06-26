import { NodeProps } from 'reactflow';
import { Tags } from 'lucide-react';
import NodeShell from './NodeShell';

export default function AddTagNode({ data, selected }: NodeProps) {
  return (
    <NodeShell icon={<Tags size={15} />} title="Add Tag" accent="#f97316" selected={selected} width={188}>
      {data.tags?.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {data.tags.map((t: string, i: number) => (
            <span key={i} className="text-[10px] bg-orange-500/15 text-orange-300 px-2 py-0.5 rounded-full font-medium">{t}</span>
          ))}
        </div>
      ) : (
        <span className="text-slate-500 italic">Click to add tags…</span>
      )}
    </NodeShell>
  );
}
