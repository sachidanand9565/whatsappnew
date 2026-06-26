import { NodeProps } from 'reactflow';
import { Image } from 'lucide-react';
import NodeShell from './NodeShell';

export default function SendMediaNode({ data, selected }: NodeProps) {
  return (
    <NodeShell icon={<Image size={15} />} title="Send Media" accent="#ec4899" selected={selected} width={216}>
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold bg-pink-500/15 text-pink-300 px-2 py-0.5 rounded-full capitalize">{data.media_type || 'image'}</span>
        <p className="text-slate-400 truncate">{data.url ? 'URL set' : 'No media set'}</p>
      </div>
      {data.caption && <p className="text-slate-400 line-clamp-2 mt-1">{data.caption}</p>}
    </NodeShell>
  );
}
