import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';
import NodeShell, { HANDLE_CLASS, CANVAS_BG } from './NodeShell';

export default function ConditionNode({ data, selected }: NodeProps) {
  return (
    <NodeShell
      icon={<GitBranch size={15} />} title="Condition" accent="#a855f7" selected={selected} width={224}
      hasSource={false}
      extraHandles={
        <>
          <Handle type="source" position={Position.Right} id="true" style={{ top: '64%', background: '#22c55e', borderColor: CANVAS_BG }} className={HANDLE_CLASS} />
          <Handle type="source" position={Position.Right} id="false" style={{ top: '84%', background: '#ef4444', borderColor: CANVAS_BG }} className={HANDLE_CLASS} />
        </>
      }
    >
      {data.variable ? (
        <p className="text-slate-300">
          <span className="font-mono text-purple-300 bg-purple-500/10 px-1 rounded">{data.variable}</span>
          {' '}<span className="text-slate-500">{data.operator}</span>{' '}
          <span className="font-mono text-purple-300 bg-purple-500/10 px-1 rounded">{data.value}</span>
        </p>
      ) : (
        <span className="text-slate-500 italic">Click to set condition…</span>
      )}
      <div className="flex justify-between mt-2.5 text-[10px] font-semibold">
        <span className="text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">✓ True</span>
        <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">✗ False</span>
      </div>
    </NodeShell>
  );
}
