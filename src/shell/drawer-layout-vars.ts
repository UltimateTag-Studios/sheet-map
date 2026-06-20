import type { MapSheetGeometry } from "./config";

export {
  buildSheetLayoutVars as buildSheetMapDrawerLayoutVars,
  buildSheetStyle as buildSheetMapDrawerStyle,
  DEFAULT_SHEET_HANDLE_BAR_HEIGHT as DEFAULT_DRAWER_HANDLE_BAR_HEIGHT,
  DEFAULT_SHEET_HANDLE_MARGIN_BOTTOM as DEFAULT_DRAWER_HANDLE_MARGIN_BOTTOM,
  DEFAULT_SHEET_HANDLE_MARGIN_TOP as DEFAULT_DRAWER_HANDLE_MARGIN_TOP,
} from "@siegetag/sheet";

/** Whether layout config requests floating tab bar bottom padding. */
export function reservesFloatingTabBar(layout: MapSheetGeometry = {}): boolean {
  return layout.reserveFloatingTabBar === true;
}
