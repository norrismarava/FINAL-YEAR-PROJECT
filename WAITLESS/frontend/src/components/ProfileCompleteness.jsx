export function ProfileCompleteness({ value, className = "" }) {
  const percentage = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
          Profile completeness
        </span>
        <span className="text-xs font-bold tabular-nums text-accent">{percentage}%</span>
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Profile completeness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#0dc5dc,#338cff)] transition-[width] duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
