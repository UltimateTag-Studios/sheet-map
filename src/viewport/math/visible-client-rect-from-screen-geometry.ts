import type { SheetSnap } from "@siegetag/sheet";

import type {
  MapCanvasScreenGeometry,
  PixelRect,
  SheetSnapHeightsPx,
} from "../types";
import { visibleClientRectFromLiveSheetObscured } from "./visible-client-rect-from-live-sheet-obscured";

/** Visible map bounds from snap heights (fallback when live sheet is unavailable). */
export function visibleClientRectFromScreenGeometry(
  snap: SheetSnap,
  snapHeights: SheetSnapHeightsPx,
  geometry: MapCanvasScreenGeometry,
): PixelRect {
  return visibleClientRectFromLiveSheetObscured(geometry, snapHeights[snap]);
}
