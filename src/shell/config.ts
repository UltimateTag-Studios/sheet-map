import {
  DEFAULT_HALF_SNAP_FRACTION,
  DEFAULT_THEME,
  type SheetLayout,
  type Theme,
} from "@siegetag/sheet";
import type { ReactNode } from "react";

import type { MapUserLocationCoords } from "../camera/hooks/use-map-user-tracking";
import type { MapUserLocationStyleOverrides } from "../canvas/user-location/style-overrides";
import type { MapItem } from "../items/types";
import type { MapObscuredInsets } from "../viewport";
import type { MapShellLayout } from "./map-shell-layout-vars";

export type { MapUserLocationCoords, SheetLayout, Theme };

export type MapChromeInsets = Partial<MapObscuredInsets>;

export type MapShellConfig = {
  /** Map style + shell chrome pairing. Default `light`. */
  theme?: Theme;
  /** Sheet geometry — handle, panel, header/body, divider, list, tab-bar reserve. */
  sheetLayout?: SheetLayout;
  /** Map overlay geometry — action button slot, my location control. */
  layout?: MapShellLayout;
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
  renderActionButton?: (onPress: () => void, ariaLabel: string) => ReactNode;
  renderUserLocation?: (
    tracking: boolean,
    accuracyMeters?: number,
  ) => MapUserLocationStyleOverrides | null;
  renderMapItem?: (item: MapItem, selected: boolean) => ReactNode;
  renderSheetListItem?: (item: MapItem, selected: boolean) => ReactNode;
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
  theme: DEFAULT_THEME,
  initialZoom: 15,
  smoothFlyDurationMs: 600,
  trackingReleaseThresholdPx: 40,
  myLocationAriaLabel: "Focus my location",
  closeSheetAriaLabel: "Close sheet",
  halfSnapFraction: DEFAULT_HALF_SNAP_FRACTION,
};
