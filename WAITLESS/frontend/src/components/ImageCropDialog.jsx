import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";

const VIEWPORT = 300;
const OUTPUT_SIZE = 640;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function clampOffset(value, viewport, contentSize) {
  const min = viewport - contentSize;
  return Math.min(0, Math.max(min, value));
}

function clampZoom(value) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
}

export function ImageCropDialog({ file, src, title = "Adjust profile photo", onConfirm, onCancel }) {
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  // Single source of truth for zoom + pan (kept in a ref so window-level
  // listeners always see the latest values without re-registering).
  const [view, setViewState] = useState({ zoom: MIN_ZOOM, x: 0, y: 0 });
  const viewRef = useRef(view);
  const setView = useCallback((next) => {
    const resolved = typeof next === "function" ? next(viewRef.current) : next;
    viewRef.current = resolved;
    setViewState(resolved);
  }, []);

  const viewportRef = useRef(null);
  const dragRef = useRef({ startX: 0, startY: 0, originX: 0, originY: 0 });
  const imageUrlRef = useRef(null);
  const [imageUrl, setImageUrl] = useState("");

  const baseScale = image ? VIEWPORT / Math.min(image.naturalWidth, image.naturalHeight) : 1;
  const scale = baseScale * view.zoom;
  const drawnW = image ? image.naturalWidth * scale : 0;
  const drawnH = image ? image.naturalHeight * scale : 0;

  const clampAll = useCallback(
    (next) => ({
      x: clampOffset(next.x, VIEWPORT, drawnW),
      y: clampOffset(next.y, VIEWPORT, drawnH),
    }),
    [drawnW, drawnH],
  );

  const applyZoom = useCallback(
    (nextZoomRaw) => {
      const current = viewRef.current;
      const nextZoom = clampZoom(nextZoomRaw);
      if (!image) {
        setView({ ...current, zoom: nextZoom });
        return;
      }
      // Keep the viewport centre anchored while zooming (Facebook-style)
      const prevScale = baseScale * current.zoom;
      const nextScale = baseScale * nextZoom;
      const cx = VIEWPORT / 2;
      const cy = VIEWPORT / 2;
      const imgCx = (cx - current.x) / prevScale;
      const imgCy = (cy - current.y) / prevScale;
      setView({
        zoom: nextZoom,
        ...clampAll({ x: cx - imgCx * nextScale, y: cy - imgCy * nextScale }),
      });
    },
    [image, baseScale, clampAll, setView],
  );

  // Resolve the source image (new File or an existing URL)
  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    async function resolveSource() {
      setImage(null);
      setError("");
      try {
        if (file) {
          objectUrl = URL.createObjectURL(file);
        } else if (src) {
          if (src.startsWith("data:") || src.startsWith("/") || src.startsWith(window.location.origin)) {
            objectUrl = src;
          } else {
            // Cross-origin URL — fetch it so the canvas stays untainted
            const response = await fetch(src);
            if (!response.ok) throw new Error("Could not load the current photo.");
            objectUrl = URL.createObjectURL(await response.blob());
          }
        } else {
          return;
        }

        imageUrlRef.current = objectUrl;
        if (!cancelled) setImageUrl(objectUrl);

        const img = new Image();
        img.onload = () => {
          if (!cancelled) setImage(img);
        };
        img.onerror = () => {
          if (!cancelled) setError("This image could not be opened.");
        };
        img.src = objectUrl;
      } catch (err) {
        if (!cancelled) setError(err?.message ?? "This image could not be opened.");
      }
    }

    resolveSource();

    return () => {
      cancelled = true;
      if (objectUrl && objectUrl.startsWith("blob:")) {
        URL.revokeObjectURL(objectUrl);
      }
      imageUrlRef.current = null;
    };
  }, [file, src]);

  // Reset view when a new image arrives
  useEffect(() => {
    if (image) setView({ zoom: MIN_ZOOM, x: 0, y: 0 });
  }, [image, setView]);

  // Escape to close
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  // Drag — window-level listeners so the pointer can leave the viewport mid-drag
  useEffect(() => {
    if (!dragging) return undefined;

    function onMove(e) {
      const d = dragRef.current;
      setView((current) => ({
        ...current,
        ...clampAll({
          x: d.originX + (e.clientX - d.startX),
          y: d.originY + (e.clientY - d.startY),
        }),
      }));
    }

    function onUp() {
      setDragging(false);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragging, clampAll, setView]);

  // Wheel zoom — native listener so we can preventDefault (React's is passive)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;

    function onWheel(e) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      applyZoom(viewRef.current.zoom + delta);
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [applyZoom]);

  function onPointerDown(e) {
    if (!image) return;
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: viewRef.current.x,
      originY: viewRef.current.y,
    };
    setDragging(true);
  }

  function handleReset() {
    setView({ zoom: MIN_ZOOM, x: 0, y: 0 });
  }

  async function handleConfirm() {
    if (!image) return;
    setSaving(true);
    try {
      const size = VIEWPORT / scale;
      const sx = -view.x / scale;
      const sy = -view.y / scale;

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("This browser cannot prepare the selected image.");
      ctx.drawImage(image, sx, sy, size, size, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
      if (!blob) throw new Error("This image could not be prepared.");

      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("This image could not be prepared."));
        reader.readAsDataURL(blob);
      });

      await onConfirm({ base64: dataUrl.split(",")[1], dataUrl });
    } catch (err) {
      setError(err?.message ?? "Could not apply the crop.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h2 className="font-display text-base font-bold">{title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Drag to reposition · scroll or slide to zoom
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center px-5 py-5">
          {/* Crop viewport */}
          <div
            ref={viewportRef}
            className={`relative touch-none select-none overflow-hidden rounded-xl bg-black/40 ${
              dragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{ width: VIEWPORT, height: VIEWPORT }}
            onPointerDown={onPointerDown}
          >
            {image && imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-0 top-0 max-w-none"
                style={{
                  width: drawnW,
                  height: drawnH,
                  transform: `translate(${view.x}px, ${view.y}px)`,
                }}
              />
            ) : (
              <div className="grid h-full w-full place-items-center">
                {error ? (
                  <span className="px-6 text-center text-xs text-destructive">{error}</span>
                ) : (
                  <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                )}
              </div>
            )}

            {/* Circular crop guide (avatar) */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at center, transparent 0%, transparent 44%, rgba(4, 10, 22, 0.62) 45%, rgba(4, 10, 22, 0.62) 100%)",
              }}
            />
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
              style={{ width: VIEWPORT * 0.88, height: VIEWPORT * 0.88 }}
            />
          </div>

          {/* Zoom control */}
          <div className="mt-5 flex w-full max-w-[300px] items-center gap-3">
            <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={view.zoom}
              onChange={(e) => applyZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="w-full accent-primary"
            />
            <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>

          {error && image ? (
            <p className="mt-3 text-center text-xs text-destructive">{error}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 px-5 py-4">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!image || saving}
              className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              {saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
              {saving ? "Saving…" : "Apply photo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
