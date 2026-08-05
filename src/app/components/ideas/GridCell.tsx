import { useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown as Caret, Loader2, Lock } from "lucide-react";
import type { CellIndicator, Column, MoveDir } from "../../types";
import { LOCK_REASON } from "../../lib/locking";

const CELL_H = 54; // px — 2 lines × (13px × 1.375 lh) + 9px × 2 padding

function TooltipCard({ text, anchor }: { text: string; anchor: DOMRect }) {
  const viewportW = window.innerWidth;
  const cardW = 280;
  const gap = 6;

  let top = anchor.bottom + gap;
  if (top + 120 > window.innerHeight) top = anchor.top - gap - 8;

  let left = anchor.left;
  if (left + cardW > viewportW - 8) left = viewportW - cardW - 8;
  if (left < 8) left = 8;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top,
        left,
        width: cardW,
        zIndex: 9999,
        backgroundColor: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)",
        padding: "10px 13px",
        fontSize: 12.5,
        lineHeight: 1.5,
        color: "#1c1c1e",
        pointerEvents: "none",
        animation: "tooltip-in 120ms cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      {text}
    </div>,
    document.body,
  );
}

const clampStyle: React.CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  lineHeight: "1.375",
};

export function GridCell({
  col,
  value,
  active,
  editing,
  seed,
  placeholder,
  indicator,
  locked,
  swapClass = "",
  swapStyle,
  onSelect,
  onStartEdit,
  onCommit,
  onCancel,
  onLocked,
}: {
  col: Column;
  value: string;
  active: boolean;
  editing: boolean;
  seed: string;
  placeholder?: string;
  indicator?: CellIndicator;
  locked?: boolean;
  swapClass?: string;
  swapStyle?: React.CSSProperties;
  onSelect: () => void;
  onStartEdit: () => void;
  onCommit: (v: string, move: MoveDir) => void;
  onCancel: () => void;
  onLocked?: () => void;
}) {
  const isFirst = col.key === "uid";
  const contentRef = useRef<HTMLSpanElement>(null);
  const [tooltipAnchor, setTooltipAnchor] = useState<DOMRect | null>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLTableCellElement>) => {
    if (!col.tooltip || !value) return;
    const el = contentRef.current;
    // Only show if text is actually clamped (overflows the 2-line box)
    if (el && el.scrollHeight > el.clientHeight + 1) {
      setTooltipAnchor(e.currentTarget.getBoundingClientRect());
    }
  }, [col.tooltip, value]);

  const handleMouseLeave = useCallback(() => setTooltipAnchor(null), []);

  if (editing) {
    if (col.options) {
      return (
        <td className="p-0" style={{ borderRight: "1px solid rgba(0,0,0,0.05)" }}>
          <select
            autoFocus
            defaultValue={value}
            onChange={e => onCommit(e.target.value, null)}
            onBlur={e => onCommit(e.target.value, null)}
            onKeyDown={e => {
              if (e.key === "Escape") { e.preventDefault(); onCancel(); }
            }}
            className="w-full px-3 py-[9px] text-[13px] bg-white outline-none"
            style={{ boxShadow: "0 0 0 2px rgba(13,45,107,0.55) inset" }}
          >
            <option value="">—</option>
            {col.options.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </td>
      );
    }
    return (
      <td className="p-0" style={{ borderRight: "1px solid rgba(0,0,0,0.05)" }}>
        <input
          autoFocus
          key={seed}
          defaultValue={seed}
          onFocus={e => e.target.select()}
          onBlur={e => onCommit(e.target.value, null)}
          onKeyDown={e => {
            const el = e.target as HTMLInputElement;
            if (e.key === "Enter") { e.preventDefault(); onCommit(el.value, "down"); }
            else if (e.key === "Tab") { e.preventDefault(); onCommit(el.value, "right"); }
            else if (e.key === "Escape") { e.preventDefault(); onCancel(); }
          }}
          className="w-full px-3 py-[9px] text-[13px] bg-white outline-none"
          style={{ boxShadow: "0 0 0 2px rgba(13,45,107,0.55) inset" }}
        />
      </td>
    );
  }

  const textColor = locked ? "#aeaeb2" : isFirst ? "#1c1c1e" : "#3c3c43";

  return (
    <>
      <td
        onClick={onSelect}
        onDoubleClick={locked ? onLocked : onStartEdit}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={locked ? LOCK_REASON : undefined}
        style={{
          ...swapStyle,
          height: CELL_H,
          borderRight: "1px solid rgba(0,0,0,0.05)",
          boxShadow: active
            ? locked
              ? "0 0 0 2px rgba(156,163,175,0.5) inset"
              : "0 0 0 2px rgba(13,45,107,0.55) inset"
            : undefined,
          backgroundColor: active
            ? locked ? "rgba(156,163,175,0.06)" : "rgba(13,45,107,0.03)"
            : undefined,
        }}
        className={`${swapClass} px-3 py-[9px] select-none text-[13px] transition-colors duration-100 ${
          locked ? "cursor-not-allowed" : "cursor-cell"
        } ${isFirst && !locked ? "font-medium" : ""}`}
      >
        <span
          ref={col.tooltip ? contentRef : undefined}
          style={{ ...clampStyle, color: textColor }}
        >
          {isFirst && locked && (
            <Lock size={11} className="shrink-0 inline mr-1" style={{ color: "#aeaeb2" }} strokeWidth={2} />
          )}
          {value !== "" ? value : (
            <span style={{ color: "#c7c7cc" }}>{placeholder}</span>
          )}
          {!locked && col.options && active && <Caret size={10} strokeWidth={2} style={{ color: "#aeaeb2", display: "inline", marginLeft: 2 }} />}
          {indicator === "saving" && (
            <Loader2 size={10} className="animate-spin inline ml-1" style={{ color: "#f59e0b" }} />
          )}
          {indicator === "dirty" && (
            <span className="w-1.5 h-1.5 rounded-full inline-block ml-1" style={{ backgroundColor: "#f59e0b" }} title="Unsaved changes" />
          )}
          {indicator === "error" && (
            <span className="w-1.5 h-1.5 rounded-full inline-block ml-1" style={{ backgroundColor: "#ef4444" }} title="Save failed" />
          )}
        </span>
      </td>
      {tooltipAnchor && <TooltipCard text={value} anchor={tooltipAnchor} />}
    </>
  );
}
