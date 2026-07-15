import waitlessLogo from "@/assets/waitlesslogo-cropped.png";

export function WaitLessLogo({
  compact = false,
  className = "",
  subtitle = "Hospital Queue OS",
  subtitleClassName = "",
}) {
  return (
    <div className={`inline-flex flex-col leading-none ${className}`}>
      <img
        src={waitlessLogo}
        alt="WaitLess"
        className={`w-auto object-contain drop-shadow-[0_10px_24px_rgba(15,118,110,0.12)] ${
          compact ? "h-9 max-w-[132px]" : "h-10 max-w-[168px] sm:h-11 sm:max-w-[182px]"
        }`}
      />
      {!compact && subtitle ? (
        <div
          className={`mt-1 pl-1 text-[11px] uppercase tracking-[0.28em] text-current opacity-65 ${subtitleClassName}`}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}
