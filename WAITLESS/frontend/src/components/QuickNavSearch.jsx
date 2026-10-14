import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";

const DESTINATIONS = [
  { label: "Check in and get a queue ticket", to: "/self-register", keywords: "check in ticket queue register walk in book spot" },
  { label: "Track my ticket", to: "/track", keywords: "track ticket position wait status code" },
  { label: "Live queue board", to: "/queue", keywords: "queue board live display waiting room now serving" },
  { label: "Department display board", to: "/department-board", keywords: "department board screen display" },
  { label: "Kiosk check in screen", to: "/kiosk", keywords: "kiosk reception desk check in machine" },
  { label: "Create a patient account", to: "/patient/register", keywords: "patient account register sign up create" },
  { label: "Patient sign in", to: "/patient/login", keywords: "patient login sign in" },
  { label: "Patient dashboard", to: "/patient/dashboard", keywords: "dashboard appointments profile my account" },
  { label: "Share feedback", to: "/patient/feedback", keywords: "feedback review rate complaint comment" },
  { label: "Staff sign in", to: "/admin/login", keywords: "staff admin login work nurse doctor" },
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
    document.addEventListener("mousedown", onClickAway);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
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
          <ArrowRight className={`h-3.5 w-3.5 shrink-0 transition-colors ${i === active ? "text-teal-300" : "text-white/25"}`} />
          <span className="flex-1">{d.label}</span>
        </button>
      ))}
    </div>,
    document.body,
  ) : null;

  return (
    <div ref={wrapRef} className="relative hidden w-44 md:block lg:w-56 xl:w-72">
      <div className="group flex h-11 items-center gap-2 rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.045))] p-1 pl-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_30px_-18px_rgba(2,8,20,0.85)] backdrop-blur-xl transition-all duration-300 focus-within:border-teal-300/45 focus-within:bg-white/[0.09] focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_0_4px_rgba(45,212,191,0.14),0_18px_38px_-18px_rgba(13,148,136,0.55)]">
        <Search className="h-4 w-4 shrink-0 text-teal-300/70 transition-colors duration-300 group-focus-within:text-teal-200" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search for destination"
          aria-label="Search for destination"
          onChange={(e) => { setQuery(e.target.value); setActive(0); openDropdown(); }}
          onFocus={openDropdown}
          onKeyDown={onKeyDown}
          className="w-full bg-transparent py-2 text-[13px] font-medium text-white placeholder:text-white/35 focus:outline-none"
        />
        <button
          type="button"
          aria-label="Search"
          onClick={() => (results.length ? go(results[Math.min(active, results.length - 1)].to) : openDropdown())}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#0f766e,#14b8a6)] text-white shadow-[0_6px_16px_-6px_rgba(20,184,166,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-transform hover:scale-105 active:scale-95"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      {dropdown}
    </div>
  );
}
