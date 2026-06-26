import { NodeProps } from 'reactflow';
import { Globe } from 'lucide-react';
import NodeShell from './NodeShell';

export default function ApiNode({ data, selected }: NodeProps) {
  return (
    <NodeShell icon={<Globe size={15} />} title="API Request" accent="#8b5cf6" selected={selected} width={224}>
      <div className="flex items-center gap-2">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
          data.method === 'POST' ? 'bg-orange-500/15 text-orange-300' : 'bg-blue-500/15 text-blue-300'
        }`}>{data.method || 'GET'}</span>
        <p className="text-slate-300 truncate font-mono text-[10px]">{data.url || 'No URL set'}</p>
      </div>
      {data.save_as && (
        <p className="text-[10px] text-slate-500 mt-1">Save as: <span className="font-mono text-violet-300">{data.save_as}</span></p>
      )}
    </NodeShell>
  );
}
