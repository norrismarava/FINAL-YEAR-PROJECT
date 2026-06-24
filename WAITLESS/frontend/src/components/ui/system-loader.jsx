import { cn } from "@/utils/cn";

const BOXES = [0, 1, 2, 3];
const SIZE_MAP = {
  sm: "18px",
  md: "26px",
  lg: "32px",
};

function SystemLoader({ className, decorative = false, label = "Loading", size = "md" }) {
  return (
    <div
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : label}
      className={cn("system-loader", className)}
      role={decorative ? undefined : "status"}
      style={{ "--loader-size": SIZE_MAP[size] ?? SIZE_MAP.md }}
    >
      {!decorative && <span className="sr-only">{label}</span>}
      {BOXES.map((box) => (
        <span key={box} className="system-loader__box">
          <span className="system-loader__face" />
          <span className="system-loader__face" />
          <span className="system-loader__face" />
          <span className="system-loader__face" />
        </span>
      ))}
    </div>
  );
}

function LoadingPanel({ className, compact = false, message, surface = true, title = "Loading" }) {
  return (
    <div
      aria-live="polite"
      className={cn(
        surface && "surface-panel",
        "flex items-center text-muted-foreground",
        compact
          ? "gap-4 px-5 py-6 text-left"
          : "flex-col justify-center gap-4 px-5 py-8 text-center",
        className,
      )}
      role="status"
    >
      <SystemLoader decorative size={compact ? "sm" : "md"} />
      <div>
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {message && <p className="mt-1 text-sm leading-6 text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}

export { LoadingPanel, SystemLoader };
