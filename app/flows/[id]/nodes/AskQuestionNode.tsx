import { NodeProps } from 'reactflow';
import { HelpCircle } from 'lucide-react';
import NodeShell from './NodeShell';

export default function AskQuestionNode({ data, selected }: NodeProps) {
  return (
    <NodeShell icon={<HelpCircle size={15} />} title="Ask Question" accent="#06b6d4" selected={selected} width={224}>
      <p className="text-slate-300 line-clamp-2">{data.question || <span className="text-slate-500 italic">Click to add question…</span>}</p>
      {data.save_as && (
        <p className="text-[10px] text-slate-500 mt-1">Save reply as: <span className="font-mono text-cyan-300">{'{{' + data.save_as + '}}'}</span></p>
      )}
    </NodeShell>
  );
}
