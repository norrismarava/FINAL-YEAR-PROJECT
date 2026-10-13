import waitlessLogoIcon from "@/assets/waitless-logo-icon.png";
import { cn } from "@/utils/cn";

const SIZE_MAP = { sm: 26, md: 44, lg: 72 };

export function LogoLoader({
  size = "md",
  className,
  label = "Loading",
  decorative = false,
}) {
  const px = typeof size === "number" ? size : (SIZE_MAP[size] ?? SIZE_MAP.md);
  return (
    <div
      className={cn("wl-loader", className)}
      style={{ "--wl-size": `${px}px` }}
      role={decorative ? undefined : "status"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? "true" : undefined}
    >
      <span className="wl-loader__cross" aria-hidden="true" />
      <img className="wl-loader__clock" src={waitlessLogoIcon} alt="" aria-hidden="true" />
      <span className="wl-loader__cover" aria-hidden="true" />
      <svg
        className="wl-loader__check"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5.5 13l4.4 4.4L19.5 8"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!decorative && <span className="sr-only">{label}</span>}
    </div>
  );
}
