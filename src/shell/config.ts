import type { CSSProperties, ReactNode } from "react";

import type { MapObscuredInsets } from "../canvas/viewport/map-viewport";
import { DEFAULT_HALF_SNAP_FRACTION } from "./normalize-half-snap-fraction";

export type MapChromeInsets = Partial<MapObscuredInsets>;

/** Sheet drawer geometry — spacing and clearance. Visuals: theme CSS on `.sheet-map-*` classes. */
export type MapSheetLayout = {
  /** Handle block top margin (default `0.75rem`). Number = px. */
  drawerHandleMarginTop?: number | string;
  /** Handle bar height (default `0.25rem`). Number = px. */
  drawerHandleBarHeight?: number | string;
  /** Gap between handle bar and peek content (default `0.75rem`). Number = px. */
  drawerHandleMarginBottom?: number | string;
  /** Optical trim on handle spacer under peek (default `-7`). */
  peekBalanceAdjustPx?: number;
  /** When true, sheet spacers use @siegetag/ui floating tab bar reserves (safe area added in CSS). */
  reserveFloatingTabBar?: boolean;
};

/** Optional visual overrides merged onto drawer surfaces. */
export type MapSheetStyles = {
  drawer?: CSSProperties;
  drawerHandle?: CSSProperties;
};

export type MapShellConfig = {
  /** Sheet drawer geometry — defaults work out of the box. */
  layout?: MapSheetLayout;
  /** Optional drawer/handle visual overrides (colors, shadows, …). */
  styles?: MapSheetStyles;
  /** Extra obscured area (tab bar, top nav). Combined with sheet insets. */
  fixedChromeInsets?: MapChromeInsets;
  /** Extra pixels added below measured peek for collapsed snap (e.g. floating tab bar). */
  collapsedBottomInsetPx?: number;
  /** Vaul fraction snap between collapsed and full (default 0.5). */
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
