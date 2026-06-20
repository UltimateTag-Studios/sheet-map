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
      className="sheet-map-visible-area-debug"
      style={{
        left: clientRect.x,
        top: clientRect.y,
        width: clientRect.width,
        height: clientRect.height,
      }}
      aria-hidden
    >
      <span className="sheet-map-visible-area-debug-label">visible map</span>
      <div className="sheet-map-visible-area-debug-crosshair-v" />
      <div className="sheet-map-visible-area-debug-crosshair-h" />
    </div>
  );
}
