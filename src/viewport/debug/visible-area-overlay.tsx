import type { ReactNode } from "react";

import type { PixelRect } from "../types";

export type MapVisibleAreaOverlayProps = {
  clientRect: PixelRect | null;
  children?: ReactNode;
  className?: string;
};

/** Fixed frame aligned to the computed visible map rect for overlay controls. */
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
      <div className="sheet-map-visible-area">{children}</div>
    </div>
  );
}
