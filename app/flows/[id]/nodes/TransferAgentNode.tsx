import { Handle, Position, NodeProps } from 'reactflow';
import { UserCheck } from 'lucide-react';

export default function TransferAgentNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 min-w-[180px] transition-all ${selected ? 'border-indigo-500 shadow-indigo-100' : 'border-indigo-200'}`}>
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-t-xl px-4 py-2.5 flex items-center gap-2">
        <UserCheck size={14} className="text-white" />
        <span className="text-white font-bold text-sm">Transfer to Agent</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs text-gray-600">{data.message || 'Connecting you to an agent...'}</p>
        {data.agent_id && <p className="text-[10px] text-gray-400 mt-1">Agent: {data.agent_id}</p>}
      </div>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white" />
    </div>
  );
}
