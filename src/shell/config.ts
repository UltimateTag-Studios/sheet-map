import type { CSSProperties, ReactNode } from "react";

import type { MapObscuredInsets } from "../canvas/viewport/map-viewport";
import { DEFAULT_HALF_SNAP_FRACTION } from "./normalize-half-snap-fraction";

export type MapChromeInsets = Partial<MapObscuredInsets>;

/** Optional padding to keep sheet content clear of fixed bottom chrome (tab bar, etc.). */
export type MapBottomChromeReserve = {
  /** Header padding-bottom while collapsed (live during drag). CSS length. */
  collapsedHeaderPaddingBottom?: string;
  /** Body inner padding-bottom at full height. CSS length. */
  scrollBodyPaddingBottom?: string;
};

/** Sheet geometry — spacing and clearance. Visuals: theme CSS on `.sheet` classes. */
export type MapSheetGeometry = {
  /** Handle block top margin (default `0.75rem`). Number = px. */
  sheetHandleMarginTop?: number | string;
  /** Handle bar height (default `0.25rem`). Number = px. */
  sheetHandleBarHeight?: number | string;
  /** Gap between handle bar and header content (default `0.75rem`). Number = px. */
  sheetHandleMarginBottom?: number | string;
  /** Reserve space above app bottom chrome — values come from your app (not baked into sheet-map). */
  bottomChromeReserve?: MapBottomChromeReserve;
};

/** Optional visual overrides merged onto sheet surfaces. */
export type MapSheetStyles = {
  sheet?: CSSProperties;
  sheetHandle?: CSSProperties;
};

export type MapShellConfig = {
  /** Sheet geometry — defaults work out of the box. */
  layout?: MapSheetGeometry;
  /** Optional sheet/handle visual overrides (colors, shadows, …). */
  styles?: MapSheetStyles;
  /** Extra obscured area (tab bar, top nav). Combined with sheet insets. */
  fixedChromeInsets?: MapChromeInsets;
  /** Extra pixels added below measured header for collapsed snap (e.g. floating tab bar). */
  collapsedBottomInsetPx?: number;
  /** Fraction snap between collapsed and full (default 0.5). */
  halfSnapFraction?: number;
  initialZoom?: number;
  smoothFlyDurationMs?: number;
  followThresholdPx?: number;
  debug?: boolean;
  myLocationAriaLabel?: string;
};

export type MapUserLocationCoords = {
  lng: number;
  lat: number;
  accuracyMeters?: number;
};

export type MyLocationButtonSlotProps = {
  ariaLabel: string;
  onPress: () => void;
  focused: boolean;
};

export type UserLocationSlotProps = {
  longitude: number;
  latitude: number;
  accuracyMeters?: number;
  focused: boolean;
};

export type MapShellSlots = {
  renderMyLocationButton?: (props: MyLocationButtonSlotProps) => ReactNode;
  renderUserLocation?: (props: UserLocationSlotProps) => ReactNode;
  renderDismissButton?: (props: { onPress: () => void }) => ReactNode;
  renderTokenMissing?: (message: string) => ReactNode;
};

export const defaultMapShellConfig: Required<
  Pick<
    MapShellConfig,
    | "initialZoom"
    | "smoothFlyDurationMs"
    | "followThresholdPx"
    | "myLocationAriaLabel"
    | "collapsedBottomInsetPx"
    | "halfSnapFraction"
  >
> = {
  initialZoom: 15,
  smoothFlyDurationMs: 600,
  followThresholdPx: 40,
  myLocationAriaLabel: "Focus my location",
  collapsedBottomInsetPx: 0,
  halfSnapFraction: DEFAULT_HALF_SNAP_FRACTION,
};
