import { Handle, Position, NodeProps } from 'reactflow';
import { Image } from 'lucide-react';

export default function SendMediaNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 min-w-[200px] transition-all ${selected ? 'border-pink-500 shadow-pink-100' : 'border-pink-200'}`}>
      <div className="bg-gradient-to-r from-pink-500 to-rose-400 rounded-t-xl px-4 py-2.5 flex items-center gap-2">
        <Image size={14} className="text-white" />
        <span className="text-white font-bold text-sm">Send Media</span>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full capitalize">{data.media_type || 'image'}</span>
          <p className="text-xs text-gray-500 truncate">{data.url ? 'URL set' : 'No media set'}</p>
        </div>
        {data.caption && <p className="text-xs text-gray-600 line-clamp-2">{data.caption}</p>}
      </div>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-pink-500 !border-2 !border-white" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-pink-500 !border-2 !border-white" />
    </div>
  );
}
