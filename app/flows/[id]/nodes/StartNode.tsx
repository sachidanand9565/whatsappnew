import { Handle, Position, NodeProps } from 'reactflow';
import { Zap } from 'lucide-react';

export default function StartNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 min-w-[180px] transition-all ${
      selected ? 'border-green-500 shadow-green-100' : 'border-green-300'
    }`}>
      <div className="bg-gradient-to-r from-green-500 to-emerald-400 rounded-t-xl px-4 py-2.5 flex items-center gap-2">
        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
          <Zap size={14} className="text-white" />
        </div>
        <span className="text-white font-bold text-sm">Flow Start</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs text-gray-500">Triggers on keywords</p>
      </div>
      <Handle type="source" position={Position.Right}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white" />
    </div>
  );
}
