import { NodeProps } from 'reactflow';
import { ArrowRightCircle } from 'lucide-react';
import NodeShell from './NodeShell';

export default function ConnectFlowNode({ data, selected }: NodeProps) {
  return (
    <NodeShell icon={<ArrowRightCircle size={15} />} title="Connect Flow" accent="#84cc16" selected={selected} width={196} hasSource={false}>
      {data.flow_name ? (
        <p className="text-slate-300">→ <span className="font-semibold text-lime-300">{data.flow_name}</span></p>
      ) : (
        <span className="text-slate-500 italic">Click to select flow…</span>
      )}
    </NodeShell>
  );
}
