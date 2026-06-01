import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';

export default function ConditionNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 min-w-[200px] transition-all ${
      selected ? 'border-purple-500 shadow-purple-100' : 'border-purple-200'
    }`}>
      <div className="bg-gradient-to-r from-purple-500 to-purple-400 rounded-t-xl px-4 py-2.5 flex items-center gap-2">
        <GitBranch size={14} className="text-white" />
        <span className="text-white font-bold text-sm">Condition</span>
      </div>
      <div className="px-4 py-3">
        {data.variable ? (
          <p className="text-xs text-gray-700">
            <span className="font-mono bg-purple-50 px-1 rounded">{data.variable}</span>
            {' '}{data.operator}{' '}
            <span className="font-mono bg-purple-50 px-1 rounded">{data.value}</span>
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">Click to set condition...</p>
        )}
        <div className="flex justify-between mt-3 text-[10px] font-semibold">
          <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ True</span>
          <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-full">✗ False</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white" />
      <Handle type="source" position={Position.Right} id="true"
        style={{ top: '65%' }}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white" />
      <Handle type="source" position={Position.Right} id="false"
        style={{ top: '85%' }}
        className="!w-3 !h-3 !bg-red-400 !border-2 !border-white" />
    </div>
  );
}
