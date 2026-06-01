import { Handle, Position, NodeProps } from 'reactflow';
import { X } from 'lucide-react';

export default function EndNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 min-w-[160px] transition-all ${
      selected ? 'border-red-500 shadow-red-100' : 'border-red-200'
    }`}>
      <div className="bg-gradient-to-r from-red-500 to-red-400 rounded-t-xl px-4 py-2.5 flex items-center gap-2">
        <X size={14} className="text-white" />
        <span className="text-white font-bold text-sm">End Flow</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs text-gray-500">Conversation ends here</p>
      </div>
      <Handle type="target" position={Position.Left}
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white" />
    </div>
  );
}
