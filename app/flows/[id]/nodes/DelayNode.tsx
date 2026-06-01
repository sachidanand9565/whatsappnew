import { Handle, Position, NodeProps } from 'reactflow';
import { Clock } from 'lucide-react';

export default function DelayNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 min-w-[170px] transition-all ${selected ? 'border-slate-500 shadow-slate-100' : 'border-slate-200'}`}>
      <div className="bg-gradient-to-r from-slate-500 to-slate-400 rounded-t-xl px-4 py-2.5 flex items-center gap-2">
        <Clock size={14} className="text-white" />
        <span className="text-white font-bold text-sm">Delay</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm font-bold text-gray-800 text-center">
          {data.duration || 5} {data.unit || 'seconds'}
        </p>
        <p className="text-[10px] text-gray-400 text-center">Wait before next step</p>
      </div>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-slate-500 !border-2 !border-white" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-slate-500 !border-2 !border-white" />
    </div>
  );
}
