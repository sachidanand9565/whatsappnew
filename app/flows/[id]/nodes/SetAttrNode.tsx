import { Handle, Position, NodeProps } from 'reactflow';
import { Tag } from 'lucide-react';

export default function SetAttrNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 min-w-[180px] transition-all ${
      selected ? 'border-yellow-500 shadow-yellow-100' : 'border-yellow-200'
    }`}>
      <div className="bg-gradient-to-r from-yellow-500 to-amber-400 rounded-t-xl px-4 py-2.5 flex items-center gap-2">
        <Tag size={14} className="text-white" />
        <span className="text-white font-bold text-sm">Set Attribute</span>
      </div>
      <div className="px-4 py-3">
        {data.attribute ? (
          <p className="text-xs text-gray-700">
            <span className="font-mono bg-yellow-50 text-yellow-700 px-1 rounded">{data.attribute}</span>
            {' = '}
            <span className="font-mono bg-yellow-50 text-yellow-700 px-1 rounded">{data.value}</span>
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">Click to configure...</p>
        )}
      </div>
      <Handle type="target" position={Position.Left}
        className="!w-3 !h-3 !bg-yellow-500 !border-2 !border-white" />
      <Handle type="source" position={Position.Right}
        className="!w-3 !h-3 !bg-yellow-500 !border-2 !border-white" />
    </div>
  );
}
