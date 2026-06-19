import type { ReactNode } from "react";

import type { MapObscuredInsets } from "../canvas/viewport/map-viewport";
import { DEFAULT_PEEK_BALANCE_ADJUST_PX } from "./build-sheet-map-drawer-css-vars";
import { DEFAULT_HALF_SNAP_FRACTION } from "./normalize-half-snap-fraction";

export type MapChromeInsets = Partial<MapObscuredInsets>;

export type MapShellConfig = {
  /** Extra obscured area (tab bar, top nav). Combined with sheet insets. */
  fixedChromeInsets?: MapChromeInsets;
  /** Extra pixels added below measured peek for collapsed snap (e.g. floating tab bar). */
  collapsedBottomInsetPx?: number;
  /** Vertical peek padding (default `0.75rem`). Number = px. */
  peekPaddingY?: number | string;
  /** Optical balance trim under peek title row (default `-7`). */
  peekBalanceAdjustPx?: number;
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
    | "peekBalanceAdjustPx"
  >
> = {
  initialZoom: 15,
  smoothFlyDurationMs: 600,
  followThresholdPx: 40,
  myLocationAriaLabel: "Focus my location",
  collapsedBottomInsetPx: 0,
  halfSnapFraction: DEFAULT_HALF_SNAP_FRACTION,
  peekBalanceAdjustPx: DEFAULT_PEEK_BALANCE_ADJUST_PX,
};
