import type { CSSProperties } from "react";

/** CSS var on `.sheet-host`: fixed bottom inset for Mapbox logo (collapsed sheet height). */
export const SHEET_MAP_LOGO_BOTTOM_OFFSET_VAR =
  "--sheet-map-logo-bottom-offset" as const;

/** Host inline style for Mapbox logo offset from collapsed snap height. */
export function buildMapLogoHostStyle(
  collapsedSheetHeightPx: number,
): CSSProperties | undefined {
  if (collapsedSheetHeightPx <= 0) {
    return undefined;
  }

  return {
    [SHEET_MAP_LOGO_BOTTOM_OFFSET_VAR]: `${collapsedSheetHeightPx}px`,
  } as CSSProperties;
}
