import type { CSSProperties } from "react";

export const DEFAULT_MAP_ACTION_TOP = "0.75rem";
export const DEFAULT_MAP_ACTION_RIGHT = "0.75rem";
export const DEFAULT_MAP_ACTION_PADDING = "0.25rem";
export const DEFAULT_MAP_LOCATION_BUTTON_BOTTOM = "0.75rem";
export const DEFAULT_MAP_LOCATION_BUTTON_LEFT = "0.75rem";
export const DEFAULT_MAP_LOCATION_BUTTON_SIZE = "2.5rem";
export const DEFAULT_MAP_LOCATION_BUTTON_BORDER_RADIUS = "9999px";
export const DEFAULT_MAP_LOCATION_MARKER_SIZE = "12px";
export const DEFAULT_MAP_LOCATION_MARKER_HIT_SIZE = "32px";
export const DEFAULT_MAP_ITEM_MARKER_SIZE = "14px";
export const DEFAULT_MAP_ITEM_MARKER_HIT_SIZE = "32px";
export const DEFAULT_MAP_ITEM_MARKER_BORDER_WIDTH = "2px";
export const DEFAULT_MAP_LOGO_RIGHT = "0.75rem";
export const DEFAULT_MAP_LOGO_BOTTOM = "0";

export const SHEET_MAP_LAYOUT_VARS = {
  actionTop: "--sheet-map-action-top",
  actionRight: "--sheet-map-action-right",
  actionBottom: "--sheet-map-action-bottom",
  actionLeft: "--sheet-map-action-left",
  actionPadding: "--sheet-map-action-padding",
  locationButtonTop: "--sheet-map-location-button-top",
  locationButtonRight: "--sheet-map-location-button-right",
  locationButtonBottom: "--sheet-map-location-button-bottom",
  locationButtonLeft: "--sheet-map-location-button-left",
  locationButtonSize: "--sheet-map-location-button-size",
  locationButtonBorderRadius: "--sheet-map-location-button-border-radius",
  locationMarkerSize: "--sheet-map-location-marker-size",
  locationMarkerHitSize: "--sheet-map-location-marker-hit-size",
  itemMarkerSize: "--sheet-map-item-marker-size",
  itemMarkerHitSize: "--sheet-map-item-marker-hit-size",
  itemMarkerBorderWidth: "--sheet-map-item-marker-border-width",
  logoTop: "--sheet-map-logo-top",
  logoRight: "--sheet-map-logo-right",
  logoBottom: "--sheet-map-logo-bottom",
  logoLeft: "--sheet-map-logo-left",
} as const;

export type MapInsetLayout = {
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
};

export type MapActionButtonLayout = MapInsetLayout & {
  padding?: number | string;
};

export type MapLocationButtonLayout = MapInsetLayout & {
  size?: number | string;
  borderRadius?: number | string;
};

export type MapLocationMarkerLayout = {
  size?: number | string;
  hitSize?: number | string;
};

export type MapItemMarkerLayout = {
  size?: number | string;
  hitSize?: number | string;
  borderWidth?: number | string;
};

export type MapLogoLayout = MapInsetLayout;

export type MapLocationShellLayout = {
  button?: MapLocationButtonLayout;
  marker?: MapLocationMarkerLayout;
};

export type MapItemShellLayout = {
  marker?: MapItemMarkerLayout;
};

/** Map shell overlay geometry — action button, location chrome, item markers, logo. */
export type MapShellLayout = {
  actionButton?: MapActionButtonLayout;
  location?: MapLocationShellLayout;
  mapItem?: MapItemShellLayout;
  logo?: MapLogoLayout;
};

function toCssLength(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}

function applyOverlayVerticalAxis(
  vars: Record<string, string>,
  cssPrefix: string,
  inset: MapInsetLayout,
  defaultEdge: "top" | "bottom",
  defaultValue: string,
): void {
  const oppositeEdge = defaultEdge === "top" ? "bottom" : "top";
  const oppositeValue = inset[oppositeEdge];

  if (oppositeValue !== undefined) {
    vars[`${cssPrefix}-${oppositeEdge}`] = toCssLength(oppositeValue);
  } else {
    const defaultEdgeValue = inset[defaultEdge];
    vars[`${cssPrefix}-${defaultEdge}`] = toCssLength(
      defaultEdgeValue ?? defaultValue,
    );
  }

  const defaultEdgeValue = inset[defaultEdge];
  if (defaultEdgeValue !== undefined && oppositeValue !== undefined) {
    vars[`${cssPrefix}-${defaultEdge}`] = toCssLength(defaultEdgeValue);
  }
}

function applyOverlayHorizontalAxis(
  vars: Record<string, string>,
  cssPrefix: string,
  inset: MapInsetLayout,
  defaultEdge: "left" | "right",
  defaultValue: string,
): void {
  const oppositeEdge = defaultEdge === "left" ? "right" : "left";
  const oppositeValue = inset[oppositeEdge];

  if (oppositeValue !== undefined) {
    vars[`${cssPrefix}-${oppositeEdge}`] = toCssLength(oppositeValue);
  } else {
    const defaultEdgeValue = inset[defaultEdge];
    vars[`${cssPrefix}-${defaultEdge}`] = toCssLength(
      defaultEdgeValue ?? defaultValue,
    );
  }

  const defaultEdgeValue = inset[defaultEdge];
  if (defaultEdgeValue !== undefined && oppositeValue !== undefined) {
    vars[`${cssPrefix}-${defaultEdge}`] = toCssLength(defaultEdgeValue);
  }
}

function applyLogoVars(
  vars: Record<string, string>,
  logo: MapLogoLayout,
): void {
  if (logo.top !== undefined) {
    vars["--sheet-map-logo-top"] = toCssLength(logo.top);
  }
  if (logo.right !== undefined) {
    vars["--sheet-map-logo-right"] = toCssLength(logo.right);
  } else {
    vars["--sheet-map-logo-right"] = DEFAULT_MAP_LOGO_RIGHT;
  }
  if (logo.bottom !== undefined) {
    vars["--sheet-map-logo-bottom"] = toCssLength(logo.bottom);
  } else {
    vars["--sheet-map-logo-bottom"] = DEFAULT_MAP_LOGO_BOTTOM;
  }
  if (logo.left !== undefined) {
    vars["--sheet-map-logo-left"] = toCssLength(logo.left);
  }
}

/** Layout tokens as CSS custom properties on `.sheet-map-layout`. */
export function buildMapShellLayoutVars(
  layout: MapShellLayout = {},
): CSSProperties {
  const actionButton = layout.actionButton ?? {};
  const locationButton = layout.location?.button ?? {};
  const locationMarker = layout.location?.marker ?? {};
  const mapItemMarker = layout.mapItem?.marker ?? {};
  const logo = layout.logo ?? {};
  const vars: Record<string, string> = {};

  applyOverlayVerticalAxis(
    vars,
    "--sheet-map-action",
    actionButton,
    "top",
    DEFAULT_MAP_ACTION_TOP,
  );
  applyOverlayHorizontalAxis(
    vars,
    "--sheet-map-action",
    actionButton,
    "right",
    DEFAULT_MAP_ACTION_RIGHT,
  );
  vars["--sheet-map-action-padding"] = toCssLength(
    actionButton.padding ?? DEFAULT_MAP_ACTION_PADDING,
  );

  applyOverlayVerticalAxis(
    vars,
    "--sheet-map-location-button",
    locationButton,
    "bottom",
    DEFAULT_MAP_LOCATION_BUTTON_BOTTOM,
  );
  applyOverlayHorizontalAxis(
    vars,
    "--sheet-map-location-button",
    locationButton,
    "left",
    DEFAULT_MAP_LOCATION_BUTTON_LEFT,
  );
  vars["--sheet-map-location-button-size"] = toCssLength(
    locationButton.size ?? DEFAULT_MAP_LOCATION_BUTTON_SIZE,
  );
  vars["--sheet-map-location-button-border-radius"] = toCssLength(
    locationButton.borderRadius ?? DEFAULT_MAP_LOCATION_BUTTON_BORDER_RADIUS,
  );

  vars["--sheet-map-location-marker-size"] = toCssLength(
    locationMarker.size ?? DEFAULT_MAP_LOCATION_MARKER_SIZE,
  );
  vars["--sheet-map-location-marker-hit-size"] = toCssLength(
    locationMarker.hitSize ?? DEFAULT_MAP_LOCATION_MARKER_HIT_SIZE,
  );

  vars["--sheet-map-item-marker-size"] = toCssLength(
    mapItemMarker.size ?? DEFAULT_MAP_ITEM_MARKER_SIZE,
  );
  vars["--sheet-map-item-marker-hit-size"] = toCssLength(
    mapItemMarker.hitSize ?? DEFAULT_MAP_ITEM_MARKER_HIT_SIZE,
  );
  vars["--sheet-map-item-marker-border-width"] = toCssLength(
    mapItemMarker.borderWidth ?? DEFAULT_MAP_ITEM_MARKER_BORDER_WIDTH,
  );

  applyLogoVars(vars, logo);

  return vars as CSSProperties;
}

export function mergeMapShellLayout(
  base: MapShellLayout,
  overrides: MapShellLayout = {},
): MapShellLayout {
  const merged: MapShellLayout = {};

  if (base.actionButton || overrides.actionButton) {
    merged.actionButton = { ...base.actionButton, ...overrides.actionButton };
  }
  if (base.location || overrides.location) {
    merged.location = {
      button: { ...base.location?.button, ...overrides.location?.button },
      marker: { ...base.location?.marker, ...overrides.location?.marker },
    };
    if (
      !merged.location.button ||
      Object.keys(merged.location.button).length === 0
    ) {
      delete merged.location.button;
    }
    if (
      !merged.location.marker ||
      Object.keys(merged.location.marker).length === 0
    ) {
      delete merged.location.marker;
    }
    if (Object.keys(merged.location).length === 0) {
      delete merged.location;
    }
  }
  if (base.mapItem || overrides.mapItem) {
    merged.mapItem = {
      marker: { ...base.mapItem?.marker, ...overrides.mapItem?.marker },
    };
    if (
      !merged.mapItem.marker ||
      Object.keys(merged.mapItem.marker).length === 0
    ) {
      delete merged.mapItem;
    }
  }
  if (base.logo || overrides.logo) {
    merged.logo = { ...base.logo, ...overrides.logo };
  }

  return merged;
}
