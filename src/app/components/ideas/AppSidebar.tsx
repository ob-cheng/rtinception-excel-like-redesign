import { FileText, HelpCircle, Home } from "lucide-react";
import { currentUser, NAVY_DARK } from "../../lib/theme";

const NAV_ITEMS = [
  { icon: <Home size={19} strokeWidth={1.7} />, label: "Home", active: true },
  { icon: <FileText size={19} strokeWidth={1.7} />, label: "Ideas", active: false },
  { icon: <HelpCircle size={19} strokeWidth={1.7} />, label: "Help", active: false },
];

export function AppSidebar() {
  return (
    <aside
      className="flex flex-col items-center pt-5 pb-5 shrink-0"
      style={{
        width: 80,
        background: `linear-gradient(180deg, #0f3272 0%, ${NAVY_DARK} 100%)`,
        boxShadow: "1px 0 0 rgba(0,0,0,0.12)",
      }}
    >
      {/* Logo mark */}
      <div
        className="flex items-center justify-center rounded-[14px] text-white font-bold select-none mb-7"
        style={{
          width: 44, height: 44,
          background: "rgba(255,255,255,0.14)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 8px rgba(0,0,0,0.18)",
          fontSize: 11.5,
          letterSpacing: "0.05em",
        }}
      >
        Alcon
      </div>

      {/* Nav */}
      <nav className="flex flex-col items-center gap-0.5 w-full px-2">
        {NAV_ITEMS.map(item => (
          <button
            key={item.label}
            className={`flex flex-col items-center gap-1 w-full py-2.5 rounded-xl transition-all duration-150 active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
              item.active
                ? "text-white bg-white/[0.15] shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                : "text-white/45 hover:text-white/80 hover:bg-white/[0.07]"
            }`}
          >
            {item.icon}
            <span className="text-[9.5px] font-medium tracking-[0.02em]">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User identity */}
      <div className="flex-1" />
      <div className="flex flex-col items-center gap-1">
        <div
          className="flex items-center justify-center rounded-full text-white font-semibold select-none"
          style={{
            width: 34, height: 34,
            background: "rgba(255,255,255,0.18)",
            fontSize: 13,
            letterSpacing: "-0.01em",
            boxShadow: "0 0 0 2px rgba(255,255,255,0.1)",
          }}
        >
          {currentUser.name.charAt(0)}
        </div>
        <span className="text-[9.5px] font-medium text-white/65 mt-0.5 tracking-[0.01em]">{currentUser.name}</span>
      </div>
    </aside>
  );
}
