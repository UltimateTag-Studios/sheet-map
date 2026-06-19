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
      <div className="absolute left-2 top-2 h-4 w-4 border-cyan-400/50 border-t-2 border-l-2" />
      <div className="absolute right-2 top-2 h-4 w-4 border-cyan-400/50 border-t-2 border-r-2" />
      <div className="absolute bottom-2 left-2 h-4 w-4 border-cyan-400/50 border-b-2 border-l-2" />
      <div className="absolute bottom-2 right-2 h-4 w-4 border-cyan-400/50 border-r-2 border-b-2" />
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
      className={`pointer-events-none fixed z-10${className ? ` ${className}` : ""}`}
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
