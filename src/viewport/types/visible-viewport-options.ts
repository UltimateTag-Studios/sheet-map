import type { MapObscuredInsets } from "./insets";

export type MapVisibleViewportOptions = {
  fixedChromeInsets?: Partial<MapObscuredInsets>;
  /** Min visible map height (px) before overlay chrome is shown. Default `0`. */
  overlayMinVisibleHeightPx?: number;
};
