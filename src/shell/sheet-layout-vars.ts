import type { MapSheetGeometry } from "./config";

export {
  buildSheetLayoutVars as buildMapSheetLayoutVars,
  buildSheetStyle as buildMapSheetStyle,
  DEFAULT_SHEET_HANDLE_BAR_HEIGHT,
  DEFAULT_SHEET_HANDLE_MARGIN_BOTTOM,
  DEFAULT_SHEET_HANDLE_MARGIN_TOP,
} from "@siegetag/sheet";

/** Whether layout config reserves space above bottom chrome. */
export function hasBottomChromeReserve(layout: MapSheetGeometry = {}): boolean {
  const reserve = layout.bottomChromeReserve;
  return (
    reserve?.collapsedHeaderPaddingBottom !== undefined ||
    reserve?.scrollBodyPaddingBottom !== undefined
  );
}
