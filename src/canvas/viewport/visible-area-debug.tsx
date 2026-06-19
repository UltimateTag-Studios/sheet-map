import type { PixelRect } from "./map-viewport";

export type MapVisibleAreaDebugProps = {
  clientRect: PixelRect | null;
};

/** Dashed outline + crosshairs for the computed visible map rect. */
export function MapVisibleAreaDebug({ clientRect }: MapVisibleAreaDebugProps) {
  if (!clientRect) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed z-10 border-2 border-dashed border-amber-500 bg-amber-500/10"
      style={{
        left: clientRect.x,
        top: clientRect.y,
        width: clientRect.width,
        height: clientRect.height,
      }}
      aria-hidden
    >
      <span className="absolute left-1 top-1 font-semibold text-[9px] text-amber-500 uppercase tracking-wider">
        visible map
      </span>
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-amber-500/70" />
      <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-amber-500/70" />
    </div>
  );
}
