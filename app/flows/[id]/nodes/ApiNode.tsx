import { Handle, Position, NodeProps } from 'reactflow';
import { Globe } from 'lucide-react';

export default function ApiNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 min-w-[200px] transition-all ${
      selected ? 'border-violet-500 shadow-violet-100' : 'border-violet-200'
    }`}>
      <div className="bg-gradient-to-r from-violet-500 to-violet-400 rounded-t-xl px-4 py-2.5 flex items-center gap-2">
        <Globe size={14} className="text-white" />
        <span className="text-white font-bold text-sm">API Request</span>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            data.method === 'POST' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
          }`}>{data.method || 'GET'}</span>
          <p className="text-xs text-gray-600 truncate font-mono">{data.url || 'No URL set'}</p>
        </div>
        {data.save_as && (
          <p className="text-[10px] text-gray-400">Save as: <span className="font-mono text-violet-600">{data.save_as}</span></p>
        )}
      </div>
      <Handle type="target" position={Position.Left}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-white" />
      <Handle type="source" position={Position.Right}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-white" />
    </div>
  );
}
