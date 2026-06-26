import { NodeProps } from 'reactflow';
import { Variable } from 'lucide-react';
import NodeShell from './NodeShell';

export default function SetAttrNode({ data, selected }: NodeProps) {
  return (
    <NodeShell icon={<Variable size={15} />} title="Set Attribute" accent="#f59e0b" selected={selected} width={200}>
      {data.attribute ? (
        <p className="text-slate-300">
          <span className="font-mono text-amber-300 bg-amber-500/10 px-1 rounded">{data.attribute}</span>
          <span className="text-slate-500"> = </span>
          <span className="font-mono text-amber-300 bg-amber-500/10 px-1 rounded">{data.value}</span>
        </p>
      ) : (
        <span className="text-slate-500 italic">Click to configure…</span>
      )}
    </NodeShell>
  );
}
