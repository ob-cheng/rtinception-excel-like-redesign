import { Search, Upload } from "lucide-react";
import { NAVY } from "../../lib/theme";

export function PageHeader({
  portfolio,
  search,
  onSearchChange,
  onExport,
}: {
  portfolio: string;
  search: string;
  onSearchChange: (v: string) => void;
  onExport: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 shrink-0">
      <div>
        <h2 className="text-[24px] font-semibold text-gray-900 tracking-[-0.022em] leading-tight">Ideas List</h2>
        <p className="text-[13px] mt-0.5 font-normal" style={{ color: "#8e8e93" }}>
          {portfolio === "All" ? "All portfolios" : portfolio}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8e8e93" }} />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-[30px] pr-3 h-[34px] w-52 rounded-[10px] text-[13px] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#0d2d6b]/30 transition-all duration-150"
            style={{
              backgroundColor: "rgba(0,0,0,0.05)",
              border: "none",
              color: "#1c1c1e",
            }}
          />
        </div>
        {/* Export */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 h-[34px] px-4 rounded-[10px] text-[13px] font-medium active:scale-[0.97] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2d6b]/30"
          style={{
            backgroundColor: NAVY,
            color: "white",
            boxShadow: "0 1px 3px rgba(13,45,107,0.35), 0 1px 0 rgba(255,255,255,0.08) inset",
          }}
        >
          <Upload size={12} strokeWidth={2.2} />
          Export
        </button>
      </div>
    </div>
  );
}
