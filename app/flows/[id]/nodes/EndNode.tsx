import { NodeProps } from 'reactflow';
import { Square } from 'lucide-react';
import NodeShell from './NodeShell';

export default function EndNode({ selected }: NodeProps) {
  return (
    <NodeShell icon={<Square size={14} />} title="End Flow" accent="#ef4444" selected={selected} width={180} hasSource={false}>
      <span className="text-slate-500">Conversation ends here</span>
    </NodeShell>
  );
}
