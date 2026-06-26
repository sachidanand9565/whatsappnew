import { NodeProps } from 'reactflow';
import { Zap } from 'lucide-react';
import NodeShell from './NodeShell';

export default function StartNode({ selected }: NodeProps) {
  return (
    <NodeShell icon={<Zap size={15} />} title="Flow Start" accent="#22c55e" selected={selected} width={188} hasTarget={false}>
      <span className="text-slate-500">Triggers on keywords</span>
    </NodeShell>
  );
}
