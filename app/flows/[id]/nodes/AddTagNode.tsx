import { Handle, Position, NodeProps } from 'reactflow';
import { TagIcon } from 'lucide-react';

export default function AddTagNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 min-w-[170px] transition-all ${selected ? 'border-orange-500 shadow-orange-100' : 'border-orange-200'}`}>
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-t-xl px-4 py-2.5 flex items-center gap-2">
        <TagIcon size={14} className="text-white" />
        <span className="text-white font-bold text-sm">Add Tag</span>
      </div>
      <div className="px-4 py-3">
        {data.tags?.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {data.tags.map((t: string, i: number) => (
              <span key={i} className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">{t}</span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">Click to add tags...</p>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-orange-500 !border-2 !border-white" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-orange-500 !border-2 !border-white" />
    </div>
  );
}
