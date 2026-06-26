import { ReactNode } from 'react';
import { Handle, Position } from 'reactflow';

export const CANVAS_BG = '#0b1120';
export const HANDLE_CLASS = '!w-2.5 !h-2.5 !border-2 hover:!scale-125 !transition-transform';

/**
 * Shared dark "tech" node frame for the flow builder.
 * Renders a consistent header (icon chip + title + accent dot) and a body slot.
 * Default left/right handles are drawn unless disabled; special nodes pass
 * their own handles via `extraHandles` (keeping the same handle ids the engine expects).
 */
export default function NodeShell({
  icon, title, accent, selected, width = 212, children,
  hasTarget = true, hasSource = true, extraHandles,
}: {
  icon: ReactNode;
  title: string;
  accent: string;
  selected?: boolean;
  width?: number;
  children?: ReactNode;
  hasTarget?: boolean;
  hasSource?: boolean;
  extraHandles?: ReactNode;
}) {
  return (
    <div
      className="relative rounded-xl bg-[#0f172a]/95 backdrop-blur border transition-all"
      style={{
        width,
        borderColor: selected ? accent : 'rgba(148,163,184,0.16)',
        boxShadow: selected
          ? `0 0 0 1px ${accent}, 0 12px 32px -10px ${accent}80`
          : '0 6px 18px -8px rgba(0,0,0,0.55)',
      }}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${accent}22`, color: accent }}
        >
          {icon}
        </div>
        <span className="font-semibold text-[13px] text-slate-100 tracking-tight truncate">{title}</span>
        <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} />
      </div>

      <div className="px-3 pb-3 pt-2 text-[11px] text-slate-400 leading-relaxed border-t border-white/[0.06]">
        {children}
      </div>

      {hasTarget && (
        <Handle
          type="target"
          position={Position.Left}
          className={HANDLE_CLASS}
          style={{ background: accent, borderColor: CANVAS_BG }}
        />
      )}
      {hasSource && (
        <Handle
          type="source"
          position={Position.Right}
          className={HANDLE_CLASS}
          style={{ background: accent, borderColor: CANVAS_BG }}
        />
      )}
      {extraHandles}
    </div>
  );
}
