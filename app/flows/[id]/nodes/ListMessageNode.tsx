import { Handle, Position, NodeProps } from 'reactflow';
import { List } from 'lucide-react';

export default function ListMessageNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 min-w-[200px] max-w-[240px] transition-all ${selected ? 'border-teal-500 shadow-teal-100' : 'border-teal-200'}`}>
      <div className="bg-gradient-to-r from-teal-500 to-teal-400 rounded-t-xl px-4 py-2.5 flex items-center gap-2">
        <List size={14} className="text-white" />
        <span className="text-white font-bold text-sm">List Message</span>
      </div>
      <div className="px-4 py-3 space-y-2">
        <p className="text-xs text-gray-700 line-clamp-2">{data.body || <span className="text-gray-400 italic">Click to add body...</span>}</p>
        {data.sections?.length > 0 && (
          <div className="space-y-1">
            {data.sections.slice(0, 2).map((s: any, i: number) => (
              <div key={i} className="text-[10px] border border-teal-200 text-teal-700 rounded-lg px-2 py-1 font-medium">{s.title || `Section ${i+1}`}</div>
            ))}
            {data.sections.length > 2 && <p className="text-[10px] text-gray-400">+{data.sections.length - 2} more</p>}
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-teal-500 !border-2 !border-white" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-teal-500 !border-2 !border-white" />
    </div>
  );
}
