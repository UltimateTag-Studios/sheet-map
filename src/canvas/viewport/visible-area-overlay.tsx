import type { ReactNode } from "react";

import type { PixelRect } from "./map-viewport";

export type MapVisibleAreaOverlayProps = {
  clientRect: PixelRect | null;
  children?: ReactNode;
  className?: string;
};

function MapCanvasCornerDecorations() {
  return (
    <>
      <div className="sheet-map-visible-area-corner sheet-map-visible-area-corner--top-left" />
      <div className="sheet-map-visible-area-corner sheet-map-visible-area-corner--top-right" />
      <div className="sheet-map-visible-area-corner sheet-map-visible-area-corner--bottom-left" />
      <div className="sheet-map-visible-area-corner sheet-map-visible-area-corner--bottom-right" />
    </>
  );
}

/**
 * Borderless fixed overlay aligned to the computed visible map rect. Corner
 * brackets, legend, and other chrome live here so they track sheet snap changes.
 */
export function MapVisibleAreaOverlay({
  clientRect,
  children,
  className = "",
}: MapVisibleAreaOverlayProps) {
  if (!clientRect) {
    return null;
  }

  return (
    <div
      className={`sheet-map-visible-area-overlay${className ? ` ${className}` : ""}`}
      style={{
        left: clientRect.x,
        top: clientRect.y,
        width: clientRect.width,
        height: clientRect.height,
      }}
    >
      <MapCanvasCornerDecorations />
      {children}
    </div>
  );
}
