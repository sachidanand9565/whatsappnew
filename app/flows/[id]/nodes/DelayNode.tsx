import { NodeProps } from 'reactflow';
import { Clock } from 'lucide-react';
import NodeShell from './NodeShell';

export default function DelayNode({ data, selected }: NodeProps) {
  return (
    <NodeShell icon={<Clock size={15} />} title="Delay" accent="#94a3b8" selected={selected} width={184}>
      <p className="text-sm font-bold text-slate-100 text-center">{data.duration || 5} {data.unit || 'seconds'}</p>
      <p className="text-[10px] text-slate-500 text-center mt-0.5">Wait before next step</p>
    </NodeShell>
  );
}
