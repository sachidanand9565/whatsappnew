import { NodeProps } from 'reactflow';
import { UserCheck } from 'lucide-react';
import NodeShell from './NodeShell';

export default function TransferAgentNode({ data, selected }: NodeProps) {
  return (
    <NodeShell icon={<UserCheck size={15} />} title="Transfer to Agent" accent="#6366f1" selected={selected} width={200} hasSource={false}>
      <p className="text-slate-400 line-clamp-2">{data.message || 'Connecting you to an agent…'}</p>
      {data.agent_id && <p className="text-[10px] text-slate-500 mt-1">Agent: {data.agent_id}</p>}
    </NodeShell>
  );
}
