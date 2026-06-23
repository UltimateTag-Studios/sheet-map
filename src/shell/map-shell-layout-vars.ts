import type { CSSProperties } from "react";

export const DEFAULT_MAP_ACTION_TOP = "0.75rem";
export const DEFAULT_MAP_ACTION_RIGHT = "0.75rem";
export const DEFAULT_MAP_ACTION_PADDING = "0.25rem";
export const DEFAULT_MAP_MY_LOCATION_BOTTOM = "0.75rem";
export const DEFAULT_MAP_MY_LOCATION_LEFT = "0.75rem";
export const DEFAULT_MAP_MY_LOCATION_SIZE = "2.5rem";

export type MapInsetLayout = {
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
};

export type MapActionButtonLayout = MapInsetLayout & {
  padding?: number | string;
};

export type MapMyLocationLayout = MapInsetLayout & {
  size?: number | string;
};

/** Map shell overlay geometry — action button slot, my location control. */
export type MapShellLayout = {
  actionButton?: MapActionButtonLayout;
  myLocation?: MapMyLocationLayout;
};

function toCssLength(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}

/** Layout tokens as CSS custom properties on `.sheet-map-layout`. */
export function buildMapShellLayoutVars(
  layout: MapShellLayout = {},
): CSSProperties {
  const actionButton = layout.actionButton ?? {};
  const myLocation = layout.myLocation ?? {};
  const vars: Record<string, string> = {};

  if (actionButton.bottom !== undefined) {
    vars["--sheet-map-action-bottom"] = toCssLength(actionButton.bottom);
  } else {
    vars["--sheet-map-action-top"] = toCssLength(
      actionButton.top ?? DEFAULT_MAP_ACTION_TOP,
    );
  }
  if (actionButton.top !== undefined && actionButton.bottom !== undefined) {
    vars["--sheet-map-action-top"] = toCssLength(actionButton.top);
  }

  if (actionButton.left !== undefined) {
    vars["--sheet-map-action-left"] = toCssLength(actionButton.left);
  } else {
    vars["--sheet-map-action-right"] = toCssLength(
      actionButton.right ?? DEFAULT_MAP_ACTION_RIGHT,
    );
  }
  if (actionButton.right !== undefined && actionButton.left !== undefined) {
    vars["--sheet-map-action-right"] = toCssLength(actionButton.right);
  }

  vars["--sheet-map-action-padding"] = toCssLength(
    actionButton.padding ?? DEFAULT_MAP_ACTION_PADDING,
  );

  if (myLocation.top !== undefined) {
    vars["--sheet-map-my-location-top"] = toCssLength(myLocation.top);
  } else {
    vars["--sheet-map-my-location-bottom"] = toCssLength(
      myLocation.bottom ?? DEFAULT_MAP_MY_LOCATION_BOTTOM,
    );
  }
  if (myLocation.bottom !== undefined && myLocation.top !== undefined) {
    vars["--sheet-map-my-location-bottom"] = toCssLength(myLocation.bottom);
  }

  if (myLocation.right !== undefined) {
    vars["--sheet-map-my-location-right"] = toCssLength(myLocation.right);
  } else {
    vars["--sheet-map-my-location-left"] = toCssLength(
      myLocation.left ?? DEFAULT_MAP_MY_LOCATION_LEFT,
    );
  }
  if (myLocation.left !== undefined && myLocation.right !== undefined) {
    vars["--sheet-map-my-location-left"] = toCssLength(myLocation.left);
  }

  vars["--sheet-map-my-location-size"] = toCssLength(
    myLocation.size ?? DEFAULT_MAP_MY_LOCATION_SIZE,
  );

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
  if (base.myLocation || overrides.myLocation) {
    merged.myLocation = { ...base.myLocation, ...overrides.myLocation };
  }

  return merged;
}
