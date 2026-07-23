import { useState, useRef, useEffect } from "react";
import { Home, FileText, Camera, HelpCircle, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Plus, Upload, Copy, Trash2, ChevronDown as Caret, Filter, Check } from "lucide-react";
import { Toaster, toast } from "sonner";

// Signed-in user — in a real app this is resolved from the user ID the app reads at startup.
// Role is derived from that identity, not entered by hand.
const currentUser = { id: "sahil.k", name: "Sahil", role: "Researcher" };

const NAVY = "#0d2d6b";
const NAVY_DARK = "#0a2458";

type Idea = {
  uid: string;
  franchise: string;
  area: string;
  pathway: string;
  brand: string;
  type: string;
  project: string;
};

const initialIdeas: Idea[] = [
  { uid: "CE128", franchise: "Surgical", area: "CRCX", pathway: "IIT", brand: "BSS", type: "ATP - R&D", project: "BSS Plus" },
  { uid: "CE127", franchise: "Surgical", area: "CRCX", pathway: "Test created", brand: "BSS", type: "Contact Lens", project: "BSS Plus" },
  { uid: "CE126", franchise: "Surgical", area: "CRCX", pathway: "IIT", brand: "BSS", type: "ATP - R&D", project: "BSS Plus" },
  { uid: "CE125", franchise: "Surgical", area: "CRCX", pathway: "IIT", brand: "INTREPID", type: "ATP - R&D", project: "INTREPID Hybrid Tip" },
  { uid: "RXG005", franchise: "Surgical", area: "CRCX", pathway: "AIT", brand: "Centurion", type: "Tier 2 / 3 R&D", project: "Centurion Silver" },
  { uid: "RXG006", franchise: "Surgical", area: "CRCX", pathway: "IIT", brand: "Centurion", type: "ATP - R&D", project: "Centurion Silver" },
];

const emptyDraft: Idea = { uid: "", franchise: "", area: "", pathway: "", brand: "", type: "", project: "" };

type SortDir = "asc" | "desc" | null;

type Column = { key: keyof Idea; label: string; options?: string[] };

const columns: Column[] = [
  { key: "uid", label: "UID" },
  { key: "franchise", label: "FRANCHISE", options: ["Surgical", "Vision Care", "Pharmaceutical"] },
  { key: "area", label: "THERAPEUTIC AREA", options: ["CRCX", "Retina", "Glaucoma", "Cataract", "Dry Eye"] },
  { key: "pathway", label: "RESEARCH PATHWAY", options: ["IIT", "AIT", "Test created", "Sponsored"] },
  { key: "brand", label: "PRODUCT FAMILY (BRAND)" },
  { key: "type", label: "PRODUCT TYPE", options: ["ATP - R&D", "Tier 2 / 3 R&D", "Contact Lens", "Clinical"] },
  { key: "project", label: "PRODUCT / PROJECT" },
];

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

type MoveDir = "down" | "right" | null;

function GridCell({
  col,
  value,
  active,
  editing,
  seed,
  placeholder,
  onSelect,
  onStartEdit,
  onCommit,
  onCancel,
}: {
  col: Column;
  value: string;
  active: boolean;
  editing: boolean;
  seed: string;
  placeholder?: string;
  onSelect: () => void;
  onStartEdit: () => void;
  onCommit: (v: string, move: MoveDir) => void;
  onCancel: () => void;
}) {
  const isFirst = col.key === "uid";

  if (editing) {
    if (col.options) {
      return (
        <td className="p-0 border-r border-gray-100/80">
          <select
            autoFocus
            defaultValue={value}
            onChange={e => onCommit(e.target.value, "down")}
            onBlur={e => onCommit(e.target.value, null)}
            onKeyDown={e => {
              if (e.key === "Escape") { e.preventDefault(); onCancel(); }
            }}
            className="w-full px-4 py-[11px] text-[13px] bg-white outline-none ring-2 ring-inset ring-[#0d2d6b]"
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
      <td className="p-0 border-r border-gray-100/80">
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
          className="w-full px-4 py-[11px] text-[13px] bg-white outline-none ring-2 ring-inset ring-[#0d2d6b]"
        />
      </td>
    );
  }

  return (
    <td
      onClick={onSelect}
      onDoubleClick={onStartEdit}
      className={`px-4 py-[11px] cursor-cell select-none whitespace-nowrap border-r border-gray-100/80 text-[13px] leading-snug ${
        isFirst ? "text-gray-800 font-medium" : "text-gray-600"
      } ${active ? "ring-2 ring-inset ring-[#0d2d6b] bg-[#0d2d6b]/[0.04]" : ""}`}
    >
      <span className="inline-flex items-center gap-1">
        {value !== "" ? value : <span className="text-gray-300">{placeholder}</span>}
        {col.options && active && <Caret size={11} className="text-gray-400" />}
      </span>
    </td>
  );
}

function SortIcon({ dir }: { dir: SortDir }) {
  return (
    <span className="inline-flex flex-col ml-1 gap-[1px] opacity-40">
      <ChevronUp size={8} strokeWidth={2.5} className={dir === "asc" ? "opacity-100 text-[#0d2d6b]" : ""} />
      <ChevronDown size={8} strokeWidth={2.5} className={dir === "desc" ? "opacity-100 text-[#0d2d6b]" : ""} />
    </span>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"All" | "Draft" | "Submitted" | "Approved">("All");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [rows, setRows] = useState<Idea[]>(initialIdeas);
  const [draft, setDraft] = useState<Idea>(emptyDraft);

  // Per-column value filters (Excel-style). Empty array / missing key = no filter on that column.
  const [colFilters, setColFilters] = useState<Partial<Record<keyof Idea, string[]>>>({});
  const [openFilter, setOpenFilter] = useState<keyof Idea | null>(null);

  // Active-cell cursor + edit state (r spans sorted rows; the last index is the draft row)
  const [active, setActive] = useState<{ r: number; c: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [seed, setSeed] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

  const tabs: { label: "All" | "Draft" | "Submitted" | "Approved"; count: number }[] = [
    { label: "All", count: rows.length },
    { label: "Draft", count: 4 },
    { label: "Submitted", count: 0 },
    { label: "Approved", count: 10 },
  ];

  function handleSort(key: string) {
    if (sortCol === key) {
      setSortDir(d => d === "asc" ? "desc" : d === "desc" ? null : "asc");
      if (sortDir === "desc") setSortCol(null);
    } else {
      setSortCol(key);
      setSortDir("asc");
    }
  }

  const filtered = rows.filter(row => {
    const matchesSearch = !search || Object.values(row).some(v => v.toLowerCase().includes(search.toLowerCase()));
    const matchesFilters = columns.every(col => {
      const sel = colFilters[col.key];
      return !sel || sel.length === 0 || sel.includes(row[col.key]);
    });
    return matchesSearch && matchesFilters;
  });

  const distinctValues = (key: keyof Idea) =>
    Array.from(new Set(rows.map(r => r[key]).filter(v => v !== ""))).sort((a, b) => a.localeCompare(b));

  function toggleFilterValue(key: keyof Idea, value: string) {
    setColFilters(prev => {
      const cur = prev[key] ?? [];
      const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
      return { ...prev, [key]: next };
    });
  }

  const activeFilterCount = columns.filter(c => (colFilters[c.key]?.length ?? 0) > 0).length;

  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const av = (a as any)[sortCol] as string;
        const bv = (b as any)[sortCol] as string;
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : filtered;

  const draftIndex = sorted.length; // draft row lives just past the data rows
  const totalRows = sorted.length + 1;

  // Keep keyboard focus on the grid whenever a cell is selected but not being edited.
  useEffect(() => {
    if (active && !isEditing) gridRef.current?.focus();
  }, [active, isEditing]);

  function commitValue(r: number, c: number, val: string) {
    const key = columns[c].key;
    if (r === draftIndex) {
      const next = { ...draft, [key]: val };
      if (next.uid.trim()) {
        setRows(prev => [...prev, next]);
        setDraft(emptyDraft);
        toast.success(`Added idea ${next.uid}`);
      } else {
        setDraft(next);
      }
    } else {
      const target = sorted[r];
      if (target) setRows(prev => prev.map(row => (row.uid === target.uid ? { ...row, [key]: val } : row)));
    }
  }

  function move(dr: number, dc: number) {
    setActive(a => {
      const base = a ?? { r: 0, c: 0 };
      return { r: clamp(base.r + dr, 0, totalRows - 1), c: clamp(base.c + dc, 0, columns.length - 1) };
    });
    setIsEditing(false);
  }

  function startEdit(withSeed: string) {
    setSeed(withSeed);
    setIsEditing(true);
  }

  function currentValue(r: number, c: number) {
    const key = columns[c].key;
    return r === draftIndex ? draft[key] : (sorted[r]?.[key] ?? "");
  }

  function onGridKeyDown(e: React.KeyboardEvent) {
    if (isEditing || !active) return;
    const { r, c } = active;
    if (e.key === "ArrowUp") { e.preventDefault(); move(-1, 0); }
    else if (e.key === "ArrowDown") { e.preventDefault(); move(1, 0); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); move(0, -1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); move(0, 1); }
    else if (e.key === "Tab") {
      e.preventDefault();
      if (c < columns.length - 1) move(0, 1);
      else setActive({ r: clamp(r + 1, 0, totalRows - 1), c: 0 });
    }
    else if (e.key === "Enter" || e.key === "F2") { e.preventDefault(); startEdit(currentValue(r, c)); }
    else if ((e.key === "Delete" || e.key === "Backspace") && r !== draftIndex) { e.preventDefault(); commitValue(r, c, ""); }
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { startEdit(e.key); }
  }

  function handleCommit(r: number, c: number, val: string, dir: MoveDir) {
    commitValue(r, c, val);
    setIsEditing(false);
    if (dir === "down") setActive({ r: clamp(r + 1, 0, totalRows - 1), c });
    else if (dir === "right") setActive({ r, c: clamp(c + 1, 0, columns.length - 1) });
  }

  function duplicateRow(row: Idea) {
    let newUid = `${row.uid}-copy`;
    let n = 2;
    while (rows.some(r => r.uid === newUid)) newUid = `${row.uid}-copy${n++}`;
    setRows(prev => [...prev, { ...row, uid: newUid }]);
    toast.success(`Duplicated ${row.uid}`);
  }

  function deleteRow(row: Idea) {
    setRows(prev => prev.filter(r => r.uid !== row.uid));
    toast(`Deleted ${row.uid}`, { description: "Row removed from the list." });
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f5f5f7]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <Toaster position="bottom-right" richColors />

      {/* Sidebar */}
      <aside
        className="flex flex-col items-center pt-6 pb-6 shrink-0"
        style={{ width: 88, backgroundColor: NAVY }}
      >
        {/* Logo mark */}
        <div
          className="flex items-center justify-center rounded-2xl text-white font-semibold select-none mb-8"
          style={{ width: 48, height: 48, backgroundColor: "rgba(255,255,255,0.12)", fontSize: 12, letterSpacing: "0.04em" }}
        >
          Alcon
        </div>

        {/* Nav */}
        <nav className="flex flex-col items-center gap-0.5 w-full px-2">
          <button
            className="flex flex-col items-center gap-[5px] w-full py-2.5 rounded-xl text-white transition-colors"
            style={{ backgroundColor: "rgba(255,255,255,0.14)" }}
          >
            <Home size={20} strokeWidth={1.6} />
            <span className="text-[10.5px] font-medium tracking-[0.01em]">Home</span>
          </button>

          <button className="flex flex-col items-center gap-[5px] w-full py-2.5 rounded-xl text-white/55 hover:text-white hover:bg-white/[0.07] transition-colors">
            <FileText size={20} strokeWidth={1.6} />
            <span className="text-[10.5px] tracking-[0.01em]">My Ideas</span>
          </button>

          <button className="flex flex-col items-center gap-[5px] w-full py-2.5 rounded-xl text-white/55 hover:text-white hover:bg-white/[0.07] transition-colors">
            <Camera size={20} strokeWidth={1.6} />
            <span className="text-[10.5px] tracking-[0.01em]">Funded</span>
          </button>

          <button className="flex flex-col items-center gap-[5px] w-full py-2.5 rounded-xl text-white/55 hover:text-white hover:bg-white/[0.07] transition-colors">
            <HelpCircle size={20} strokeWidth={1.6} />
            <span className="text-[10.5px] tracking-[0.01em]">Help</span>
          </button>
        </nav>

        {/* User identity */}
        <div className="flex-1" />
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="flex items-center justify-center rounded-full text-white text-[13px] font-semibold select-none"
            style={{ width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <span className="text-[10.5px] font-medium text-white/80">{currentUser.name}</span>
          <span className="text-[9.5px] text-white/40 tracking-[0.02em]">{currentUser.role}</span>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden flex flex-col px-9 pt-8 pb-5 gap-5">

          {/* Page header */}
          <div className="flex items-center justify-between gap-4 shrink-0">
            <div>
              <h2 className="text-[22px] font-semibold text-gray-900 tracking-[-0.015em] leading-tight">Ideas List</h2>
              <p className="text-[13px] text-gray-400 mt-0.5 font-normal">Your latest research proposals and ideas</p>
            </div>
            <div className="flex items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search size={13.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search ideas…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-3.5 h-9 w-56 border border-gray-200 rounded-lg text-[13px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d2d6b]/25 focus:border-[#0d2d6b]/40 transition-shadow"
                />
              </div>
              {/* Export */}
              <button
                onClick={() => toast.success("Export started", { description: `${rows.length} ideas exported.` })}
                className="flex items-center gap-1.5 h-9 px-4 border rounded-lg text-[13px] font-medium bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-gray-50/80 active:scale-[0.98] transition-all"
                style={{ borderColor: "rgba(13,45,107,0.3)", color: NAVY }}
              >
                <Upload size={13} strokeWidth={2} />
                Export
              </button>
            </div>
          </div>

          {/* Tabs + pagination row */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center border-b border-gray-200 gap-0">
              {tabs.map(tab => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(tab.label)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border-b-[1.5px] -mb-px transition-colors ${
                    activeTab === tab.label
                      ? "border-[#0d2d6b] text-[#0d2d6b]"
                      : "border-transparent text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[11px] px-[6px] py-px rounded-full font-semibold tabular-nums ${
                      activeTab === tab.label
                        ? "bg-[#0d2d6b] text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 text-[12.5px] text-gray-400">
              <button className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors" disabled>
                <ChevronLeft size={14} />
              </button>
              <span className="px-1">Page 1 of 3</span>
              <button className="p-1 rounded hover:bg-gray-100 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div
            ref={gridRef}
            tabIndex={0}
            onKeyDown={onGridKeyDown}
            className="flex-1 overflow-auto bg-white rounded-2xl border border-gray-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none"
          >
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200/80 bg-gray-50/80 sticky top-0 z-20 backdrop-blur-sm">
                  {columns.map(col => {
                    const selected = colFilters[col.key] ?? [];
                    const isFiltered = selected.length > 0;
                    return (
                      <th
                        key={col.key}
                        className="text-left px-4 py-[11px] text-[10.5px] font-semibold text-gray-400 tracking-[0.07em] uppercase select-none whitespace-nowrap border-r border-gray-100/80 relative"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <button
                            onClick={() => handleSort(col.key)}
                            className={`flex items-center hover:text-gray-700 transition-colors cursor-pointer ${sortCol === col.key ? "text-[#0d2d6b]" : ""}`}
                          >
                            {col.label}
                            <SortIcon dir={sortCol === col.key ? sortDir : null} />
                          </button>
                          <button
                            onClick={() => setOpenFilter(o => (o === col.key ? null : col.key))}
                            title="Filter column"
                            className={`p-[3px] rounded-md transition-colors ${isFiltered ? "text-[#0d2d6b] bg-[#0d2d6b]/8" : "text-gray-300 hover:text-gray-500 hover:bg-gray-100"}`}
                          >
                            <Filter size={12} fill={isFiltered ? "currentColor" : "none"} />
                          </button>
                        </div>

                        {openFilter === col.key && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setOpenFilter(null)} />
                            <div className="absolute right-0 top-full mt-1.5 z-40 w-56 bg-white border border-gray-200/80 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] py-1 normal-case tracking-normal font-normal">
                              <div className="flex items-center justify-between px-3.5 py-2 border-b border-gray-100">
                                <span className="text-[11.5px] font-semibold text-gray-600">Filter by {col.label.toLowerCase()}</span>
                                {isFiltered && (
                                  <button
                                    onClick={() => setColFilters(prev => ({ ...prev, [col.key]: [] }))}
                                    className="text-[11.5px] font-medium text-[#0d2d6b] hover:opacity-70 transition-opacity"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                              <div className="max-h-52 overflow-auto py-1">
                                {distinctValues(col.key).length === 0 && (
                                  <div className="px-3.5 py-2.5 text-[12px] text-gray-400">No values</div>
                                )}
                                {distinctValues(col.key).map(val => {
                                  const checked = selected.includes(val);
                                  return (
                                    <button
                                      key={val}
                                      onClick={() => toggleFilterValue(col.key, val)}
                                      className="flex items-center gap-2.5 w-full text-left px-3.5 py-[7px] text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                      <span className={`flex items-center justify-center w-[15px] h-[15px] rounded-[4px] border transition-colors ${checked ? "text-white border-[#0d2d6b]" : "border-gray-300"}`}
                                        style={checked ? { backgroundColor: NAVY } : {}}>
                                        {checked && <Check size={9.5} strokeWidth={3} />}
                                      </span>
                                      {val}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </th>
                    );
                  })}
                  <th className="w-[72px] border-gray-100/80" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, ri) => (
                  <tr
                    key={row.uid}
                    className={`group border-b border-gray-100/80 transition-colors ${ri % 2 === 1 ? "bg-gray-50/30" : ""} hover:bg-[#0d2d6b]/[0.025]`}
                  >
                    {columns.map((col, ci) => (
                      <GridCell
                        key={col.key}
                        col={col}
                        value={row[col.key]}
                        active={active?.r === ri && active?.c === ci}
                        editing={isEditing && active?.r === ri && active?.c === ci}
                        seed={seed}
                        onSelect={() => { setActive({ r: ri, c: ci }); setIsEditing(false); }}
                        onStartEdit={() => { setActive({ r: ri, c: ci }); startEdit(row[col.key]); }}
                        onCommit={(v, dir) => handleCommit(ri, ci, v, dir)}
                        onCancel={() => setIsEditing(false)}
                      />
                    ))}
                    <td className="px-2.5 py-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => duplicateRow(row)}
                          title="Duplicate row"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#0d2d6b] hover:bg-[#0d2d6b]/[0.06] transition-colors"
                        >
                          <Copy size={13.5} />
                        </button>
                        <button
                          onClick={() => deleteRow(row)}
                          title="Delete row"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={13.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Draft / add row */}
                <tr className="border-b border-gray-100/80 bg-[#0d2d6b]/[0.018]">
                  {columns.map((col, ci) => (
                    <GridCell
                      key={col.key}
                      col={col}
                      value={draft[col.key]}
                      placeholder={ci === 0 ? "+ Add new idea…" : ""}
                      active={active?.r === draftIndex && active?.c === ci}
                      editing={isEditing && active?.r === draftIndex && active?.c === ci}
                      seed={seed}
                      onSelect={() => { setActive({ r: draftIndex, c: ci }); setIsEditing(false); }}
                      onStartEdit={() => { setActive({ r: draftIndex, c: ci }); startEdit(draft[col.key]); }}
                      onCommit={(v, dir) => handleCommit(draftIndex, ci, v, dir)}
                      onCancel={() => setIsEditing(false)}
                    />
                  ))}
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer status bar */}
          <div className="flex items-center justify-between text-[12px] text-gray-400 px-0.5 shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setActive({ r: draftIndex, c: 0 }); startEdit(""); }}
                className="flex items-center gap-1.5 font-medium transition-opacity hover:opacity-70"
                style={{ color: NAVY }}
              >
                <Plus size={13} strokeWidth={2.5} />
                Add row
              </button>
              <span className="text-gray-400/80">
                {sorted.length} {sorted.length === 1 ? "idea" : "ideas"}
                {(search || activeFilterCount > 0) && ` — filtered from ${rows.length}`}
                {activeFilterCount > 0 && ` · ${activeFilterCount} ${activeFilterCount === 1 ? "filter" : "filters"} active`}
              </span>
            </div>
            <span className="text-gray-300 text-[11.5px]">Double-click or type to edit · Tab / Enter to move · Del to clear</span>
          </div>

        </main>
      </div>
    </div>
  );
}
