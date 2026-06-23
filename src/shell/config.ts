import { DEFAULT_HALF_SNAP_FRACTION } from "@siegetag/sheet";
import type { CSSProperties, ReactNode } from "react";

import type { MapUserLocationCoords } from "../camera/hooks/use-map-user-tracking";
import type { MapUserLocationStyleOverrides } from "../canvas/user-location/style-overrides";
import type { MapObscuredInsets } from "../viewport";
import type { MapShellTheme } from "./map-theme";
import { DEFAULT_MAP_SHELL_THEME } from "./map-theme";

export type { MapShellTheme, MapUserLocationCoords };

export type MapChromeInsets = Partial<MapObscuredInsets>;

/** Tab-bar clearance and scroll-end gap for sheet bottom chrome reserve. */
export type MapBottomChromeReserve = {
  /** Always-on reserve spacer height (tab bar clearance). CSS length. */
  reserve: string;
  /** Body inner padding-bottom for scroll-end breathing room above tab bar. */
  floatGap: string;
};

/** Sheet geometry — spacing and clearance. Visuals: theme CSS on `.sheet` classes. */
export type MapSheetGeometry = {
  sheetHandleMarginTop?: number | string;
  sheetHandleBarHeight?: number | string;
  sheetHandleMarginBottom?: number | string;
  bottomChromeReserve?: MapBottomChromeReserve;
};

export type MapSheetStyles = {
  sheet?: CSSProperties;
  sheetHandle?: CSSProperties;
};

export type MapShellConfig = {
  /** Map style + shell chrome pairing. Default `light`. */
  theme?: MapShellTheme;
  layout?: MapSheetGeometry;
  styles?: MapSheetStyles;
  fixedChromeInsets?: MapChromeInsets;
  halfSnapFraction?: number;
  initialZoom?: number;
  smoothFlyDurationMs?: number;
  trackingReleaseThresholdPx?: number;
  debug?: boolean;
  myLocationAriaLabel?: string;
  closeSheetAriaLabel?: string;
};

export type MapSheetHeaderProps = {
  eyebrow?: string;
  title: string;
  countLabel?: string;
};

export type MapOverlayContext = {
  clientRect: { x: number; y: number; width: number; height: number } | null;
  tracking: boolean;
};

export type MapShellSlots = {
  renderMyLocationButton?: (
    onPress: () => void,
    tracking: boolean,
    ariaLabel: string,
  ) => ReactNode;
  renderCloseButton?: (onPress: () => void, ariaLabel: string) => ReactNode;
  renderUserLocation?: (
    tracking: boolean,
    accuracyMeters?: number,
  ) => MapUserLocationStyleOverrides | null;
  renderTokenMissing?: (message: string) => ReactNode;
  renderOverlay?: (ctx: MapOverlayContext) => ReactNode;
  renderSheetHeader?: (props: MapSheetHeaderProps) => ReactNode;
  renderSheetBody?: (children: ReactNode) => ReactNode;
};

export const defaultMapShellConfig: Required<
  Pick<
    MapShellConfig,
    | "theme"
    | "initialZoom"
    | "smoothFlyDurationMs"
    | "trackingReleaseThresholdPx"
    | "myLocationAriaLabel"
    | "closeSheetAriaLabel"
    | "halfSnapFraction"
  >
> = {
  theme: DEFAULT_MAP_SHELL_THEME,
  initialZoom: 15,
  smoothFlyDurationMs: 600,
  trackingReleaseThresholdPx: 40,
  myLocationAriaLabel: "Focus my location",
  closeSheetAriaLabel: "Close sheet",
  halfSnapFraction: DEFAULT_HALF_SNAP_FRACTION,
};
