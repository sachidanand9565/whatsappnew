import { Handle, Position, NodeProps } from 'reactflow';
import { ArrowRightCircle } from 'lucide-react';

export default function ConnectFlowNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 min-w-[180px] transition-all ${selected ? 'border-lime-500 shadow-lime-100' : 'border-lime-200'}`}>
      <div className="bg-gradient-to-r from-lime-500 to-green-400 rounded-t-xl px-4 py-2.5 flex items-center gap-2">
        <ArrowRightCircle size={14} className="text-white" />
        <span className="text-white font-bold text-sm">Connect Flow</span>
      </div>
      <div className="px-4 py-3">
        {data.flow_name ? (
          <p className="text-xs text-gray-700">→ <span className="font-semibold text-lime-700">{data.flow_name}</span></p>
        ) : (
          <p className="text-xs text-gray-400 italic">Click to select flow...</p>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-lime-500 !border-2 !border-white" />
    </div>
  );
}
