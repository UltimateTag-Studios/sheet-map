import type { SheetSnap } from "@siegetag/sheet";

import { resolveMapVisibleViewport } from "../math";
import type {
  MapObscuredInsets,
  MapViewportSyncState,
  SheetSnapHeightsPx,
} from "../types";

export function readSyncViewport(
  canvas: HTMLCanvasElement,
  sheetSnap: SheetSnap,
  snapHeights: SheetSnapHeightsPx,
  fixedChromeInsets?: Partial<MapObscuredInsets>,
  useSnapGeometryOnly = false,
): MapViewportSyncState | null {
  if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
    return null;
  }

  const viewport = resolveMapVisibleViewport(
    canvas,
    sheetSnap,
    snapHeights,
    fixedChromeInsets,
    { useSnapGeometryOnly },
  );

  return {
    ...viewport,
    clientRect: viewport.hasVisibleArea ? viewport.clientRect : null,
  };
}
