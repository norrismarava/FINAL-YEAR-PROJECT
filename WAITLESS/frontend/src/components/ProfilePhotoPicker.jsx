import { useRef, useState } from "react";
import { Camera, LoaderCircle } from "lucide-react";

import { prepareProfileImage } from "@/utils/profileImage";

export function ProfilePhotoPicker({
  value,
  initials = "WL",
  onImageReady,
  disabled = false,
  label = "Choose profile photo",
  size = "large",
  showHint = true,
}) {
  const inputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const frameSize = size === "compact" ? "h-28 w-28" : "h-40 w-40 sm:h-44 sm:w-44";
  const cameraSize =
    size === "compact"
      ? "h-11 w-11 border-[3px] [&_svg]:h-5 [&_svg]:w-5"
      : "h-12 w-12 border-4 sm:h-14 sm:w-14";

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setError("");
    setIsProcessing(true);

    try {
      const image = await prepareProfileImage(file);
      await onImageReady(image);
    } catch (imageError) {
      setError(imageError.message);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${frameSize}`}>
        <div className="h-full w-full overflow-hidden rounded-full border-4 border-white/90 bg-[linear-gradient(135deg,rgba(15,118,110,0.95),rgba(37,99,235,0.92))] shadow-[0_24px_60px_-28px_rgba(14,165,233,0.7)]">
          {value ? (
            <img src={value} alt="Staff profile" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center font-display text-3xl font-bold text-white">
              {initials}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isProcessing}
          title={label}
          aria-label={label}
          className={`absolute bottom-1 right-1 grid place-items-center rounded-full border-[#0b1529] bg-slate-100 text-slate-950 shadow-lg transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-65 ${cameraSize}`}
        >
          {isProcessing ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-6 w-6" />
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="sr-only"
          tabIndex={-1}
        />
      </div>

      {showHint ? (
        <div className="mt-3 text-center text-xs text-muted-foreground">
          JPEG, PNG or WebP. The image is cropped to a square.
        </div>
      ) : null}
      {error ? <div className="mt-2 text-center text-xs text-destructive">{error}</div> : null}
    </div>
  );
}
