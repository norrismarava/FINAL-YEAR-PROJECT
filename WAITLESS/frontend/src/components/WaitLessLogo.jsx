import { Check, Clock3, Cross, Route } from "lucide-react";

export function WaitLessLogo({ compact = false, className = "" }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl gradient-primary text-primary-foreground shadow-elegant">
        <Route className="absolute left-1 top-6 h-6 w-6 opacity-35" strokeWidth={2.6} />
        <Clock3 className="h-5 w-5" strokeWidth={2.5} />
        <Cross className="absolute right-1.5 top-1.5 h-3.5 w-3.5" strokeWidth={3} />
        <Check className="absolute bottom-1.5 right-1.5 h-3.5 w-3.5" strokeWidth={3} />
      </span>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-lg font-bold tracking-tight">WaitLess</div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            Hospital Queue OS
          </div>
        </div>
      )}
    </div>
  );
}
