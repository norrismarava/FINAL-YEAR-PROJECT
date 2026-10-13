import { cn } from "@/utils/cn";
import { LogoLoader } from "@/components/LogoLoader";

function SystemLoader({ className, decorative = false, label = "Loading", size = "md" }) {
  return (
    <LogoLoader
      size={size}
      className={className}
      decorative={decorative}
      label={label}
    />
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
