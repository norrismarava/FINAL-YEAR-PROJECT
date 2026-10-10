/* ─── GlowToggle ───────────────────────────────────────────────
   Recreates the Dribbble toggle micro-interaction: a heavy dark
   pill track with a metallic ring, and a knob carrying a glowing
   orb that ignites when switched on.
   ─────────────────────────────────────────────────────────── */
const TOGGLE_STYLES = `
  .glow-toggle {
    position: relative;
    width: 74px;
    height: 38px;
    border-radius: 999px;
    cursor: pointer;
    flex-shrink: 0;
    /* metallic ring + dark inner track */
    background:
      linear-gradient(145deg, #3d4552, #12161f 55%, #05080f);
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.18),
      inset 0 -1px 2px rgba(0, 0, 0, 0.55),
      0 6px 18px -8px rgba(0, 0, 0, 0.9);
    transition: box-shadow 0.35s ease;
  }
  .glow-toggle::before {
    content: "";
    position: absolute;
    inset: 3px;
    border-radius: 999px;
    background: linear-gradient(160deg, #1a2130, #0a0f18 60%, #070b12);
    box-shadow:
      inset 0 3px 8px rgba(0, 0, 0, 0.85),
      inset 0 -1px 2px rgba(148, 163, 184, 0.12);
    transition: background 0.35s ease;
  }
  .glow-toggle[data-on="true"] {
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.18),
      inset 0 -1px 2px rgba(0, 0, 0, 0.55),
      0 6px 18px -8px rgba(0, 0, 0, 0.9),
      0 0 22px -4px rgba(20, 184, 166, 0.45);
  }
  .glow-toggle[data-on="true"]::before {
    background: linear-gradient(160deg, #0d2b2e, #0a1a22 60%, #071114);
  }
  .glow-toggle__knob {
    position: absolute;
    top: 5px;
    left: 5px;
    height: 28px;
    width: 28px;
    border-radius: 999px;
    /* machined metal face */
    background: linear-gradient(160deg, #f4f7fa 0%, #c3ccd8 45%, #8b96a6 100%);
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.55),
      inset 0 1px 1px rgba(255, 255, 255, 0.9),
      inset 0 -2px 3px rgba(30, 41, 59, 0.35);
    transition: transform 0.32s cubic-bezier(0.34, 1.45, 0.5, 1);
    will-change: transform;
  }
  .glow-toggle[data-on="true"] .glow-toggle__knob {
    transform: translateX(36px);
  }
  .glow-toggle__orb {
    position: absolute;
    inset: 5px;
    border-radius: 999px;
    background: radial-gradient(circle at 38% 32%, #e2e8f0 0%, #94a3b8 55%, #64748b 100%);
    box-shadow:
      inset 0 -2px 4px rgba(15, 23, 42, 0.45),
      inset 0 1px 2px rgba(255, 255, 255, 0.7);
    transition: background 0.3s ease, box-shadow 0.3s ease;
  }
  .glow-toggle[data-on="true"] .glow-toggle__orb {
    /* molten teal core */
    background:
      radial-gradient(circle at 38% 32%, #d9fffb 0%, #5eead4 32%, #14b8a6 62%, #0f766e 100%);
    box-shadow:
      inset 0 -2px 4px rgba(4, 47, 46, 0.5),
      inset 0 1px 2px rgba(255, 255, 255, 0.8),
      0 0 10px 2px rgba(45, 212, 191, 0.65),
      0 0 22px 5px rgba(20, 184, 166, 0.35);
    animation: glow-orb-pulse 2.4s ease-in-out infinite;
  }
  @keyframes glow-orb-pulse {
    0%, 100% { box-shadow: inset 0 -2px 4px rgba(4,47,46,0.5), inset 0 1px 2px rgba(255,255,255,0.8), 0 0 10px 2px rgba(45,212,191,0.65), 0 0 22px 5px rgba(20,184,166,0.35); }
    50%      { box-shadow: inset 0 -2px 4px rgba(4,47,46,0.5), inset 0 1px 2px rgba(255,255,255,0.8), 0 0 12px 3px rgba(45,212,191,0.8), 0 0 30px 8px rgba(20,184,166,0.45); }
  }
`;

export default function GlowToggle({ checked, onChange, label, id }) {
  return (
    <>
      <style>{TOGGLE_STYLES}</style>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        id={id}
        onClick={() => onChange(!checked)}
        className="glow-toggle"
        data-on={checked}
      >
        <span className="glow-toggle__knob">
          <span className="glow-toggle__orb" />
        </span>
      </button>
    </>
  );
}
