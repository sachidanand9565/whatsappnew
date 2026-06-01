import { Handle, Position, NodeProps } from 'reactflow';
import { HelpCircle } from 'lucide-react';

export default function AskQuestionNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 min-w-[200px] max-w-[240px] transition-all ${selected ? 'border-cyan-500 shadow-cyan-100' : 'border-cyan-200'}`}>
      <div className="bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-t-xl px-4 py-2.5 flex items-center gap-2">
        <HelpCircle size={14} className="text-white" />
        <span className="text-white font-bold text-sm">Ask Question</span>
      </div>
      <div className="px-4 py-3 space-y-2">
        <p className="text-xs text-gray-700 line-clamp-2">{data.question || <span className="text-gray-400 italic">Click to add question...</span>}</p>
        {data.save_as && (
          <p className="text-[10px] text-gray-400">Save reply as: <span className="font-mono text-cyan-600">{'{{'+data.save_as+'}}'}</span></p>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-white" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-white" />
    </div>
  );
}
