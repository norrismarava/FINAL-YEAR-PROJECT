import waitlessLogo from "@/assets/waitlesslogo-cropped.png";

export function WaitLessLogo({
  compact = false,
  className = "",
  subtitle = null,
  subtitleClassName = "",
}) {
  return (
    <div className={`inline-flex flex-col leading-none ${className}`}>
      <img
        src={waitlessLogo}
        alt="WaitLess"
        className={`w-auto object-contain drop-shadow-[0_10px_24px_rgba(15,118,110,0.12)] ${
          compact ? "h-12 max-w-[180px]" : "h-14 max-w-[250px] sm:h-16 sm:max-w-[300px]"
        }`}
      />
      {!compact && subtitle ? (
        <div
          className={`mt-1.5 pl-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-current opacity-65 ${subtitleClassName}`}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}
