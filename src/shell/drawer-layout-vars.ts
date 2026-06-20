import type { CSSProperties } from "react";

import type { MapSheetLayout, MapSheetStyles } from "./config";

export const DEFAULT_DRAWER_HANDLE_MARGIN_TOP = "0.75rem";
export const DEFAULT_DRAWER_HANDLE_BAR_HEIGHT = "0.25rem";
export const DEFAULT_DRAWER_HANDLE_MARGIN_BOTTOM = "0.75rem";
export const DEFAULT_PEEK_BALANCE_ADJUST_PX = -7;

function toCssLength(
  value: number | string | undefined,
  fallback: string,
): string {
  if (value === undefined) {
    return fallback;
  }

  return typeof value === "number" ? `${value}px` : value;
}

/** Whether layout config requests floating tab bar bottom padding. */
export function reservesFloatingTabBar(layout: MapSheetLayout = {}): boolean {
  return layout.reserveFloatingTabBar === true;
}

/** Layout tokens as CSS custom properties on `.sheet-map-drawer`. */
export function buildSheetMapDrawerLayoutVars(
  layout: MapSheetLayout = {},
): CSSProperties {
  return {
    "--sheet-map-handle-margin-top": toCssLength(
      layout.drawerHandleMarginTop,
      DEFAULT_DRAWER_HANDLE_MARGIN_TOP,
    ),
    "--sheet-map-handle-bar-height": toCssLength(
      layout.drawerHandleBarHeight,
      DEFAULT_DRAWER_HANDLE_BAR_HEIGHT,
    ),
    "--sheet-map-handle-margin-bottom": toCssLength(
      layout.drawerHandleMarginBottom,
      DEFAULT_DRAWER_HANDLE_MARGIN_BOTTOM,
    ),
    "--sheet-map-peek-balance-adjust": `${layout.peekBalanceAdjustPx ?? DEFAULT_PEEK_BALANCE_ADJUST_PX}px`,
  } as CSSProperties;
}

export type SheetMapDrawerStyle = {
  drawer: CSSProperties;
  drawerHandle: CSSProperties;
};

/** Merge layout tokens with optional visual style overrides. */
export function buildSheetMapDrawerStyle(
  layout: MapSheetLayout = {},
  styles: MapSheetStyles = {},
): SheetMapDrawerStyle {
  return {
    drawer: {
      ...buildSheetMapDrawerLayoutVars(layout),
      ...styles.drawer,
    },
    drawerHandle: styles.drawerHandle ?? {},
  };
}
