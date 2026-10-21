import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

const DESTINATIONS = [
  { label: "Check in and get a queue ticket", to: "/self-register", keywords: "check in ticket queue register walk in book spot" },
  { label: "Track my ticket", to: "/track", keywords: "track ticket position wait status code" },
  { label: "Live queue board", to: "/queue", keywords: "queue board live display waiting room now serving" },
  { label: "Department display board", to: "/department-board", keywords: "department board screen display" },
  { label: "Kiosk check in screen", to: "/kiosk", keywords: "kiosk reception desk check in machine" },
  { label: "Staff sign in", to: "/login", keywords: "staff admin login work nurse doctor sign in" },
];

export default function QuickNavSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState(null);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const results = query.trim()
    ? DESTINATIONS.filter((d) =>
        `${d.label} ${d.keywords}`.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : DESTINATIONS.slice(0, 5);

  function openDropdown() {
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      setRect({ top: r.bottom + 8, left: r.left, width: r.width });
    }
    setOpen(true);
  }

  useEffect(() => {
    function onClickAway(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target) &&
          !e.target.closest("[data-quicknav-dropdown]")) {
        setOpen(false);
      }
    }
    function onScrollOrResize() { setOpen(false); }
    function onShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onClickAway);
    window.addEventListener("keydown", onShortcut);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      window.removeEventListener("keydown", onShortcut);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  function go(to) {
    setOpen(false);
    setQuery("");
    navigate(to);
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && results.length) go(results[Math.min(active, results.length - 1)].to);
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  }

  const dropdown = open && rect && results.length > 0 ? createPortal(
    <div
      data-quicknav-dropdown
      className="fixed z-[999] overflow-hidden rounded-2xl border border-white/10 bg-[#081524]/95 py-1.5 shadow-[0_24px_60px_-16px_rgba(2,8,20,0.9)] backdrop-blur-xl"
      style={{ top: rect.top, left: rect.left, width: Math.max(rect.width, 288) }}
    >
      <div className="px-4 pb-1.5 pt-2 text-[9px] font-bold uppercase tracking-[0.22em] text-white/30">
        {query.trim() ? "Matching destinations" : "Quick access"}
      </div>
      {results.map((d, i) => (
        <button
          key={d.to}
          type="button"
          onMouseEnter={() => setActive(i)}
          onClick={() => go(d.to)}
          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
            i === active ? "bg-teal-400/10 text-white" : "text-white/60"
          }`}
        >
          <span className="flex-1">{d.label}</span>
        </button>
      ))}
    </div>,
    document.body,
  ) : null;

  return (
    <div ref={wrapRef} className="relative hidden w-44 md:block lg:w-56 xl:w-72">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-cyan-100/50" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder="Search for destination"
        aria-label="Search for destination"
        onChange={(e) => { setQuery(e.target.value); setActive(0); openDropdown(); }}
        onFocus={openDropdown}
        onKeyDown={onKeyDown}
        className="h-10 w-full rounded-full border border-cyan-200/15 bg-white/6 pl-10 pr-14 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-200/35 focus:bg-white/8"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/15 bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
        ⌘K
      </span>
      {dropdown}
    </div>
  );
}
