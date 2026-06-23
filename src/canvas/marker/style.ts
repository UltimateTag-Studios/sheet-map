/** Matches `--accent` in `theme.generated.css` (`255 40 80`). */
export const MAP_DOT_FOCUS_STROKE_COLOR = "#ff2850";

export const MAP_DOT_STROKE_COLOR = "#ffffff";

export const MAP_DOT_RADIUS_PX = 8;

export const MAP_DOT_STROKE_WIDTH_PX = 2;

/** Default map-item marker (orange pin). */
export const MAP_ITEM_MARKER_SIZE_PX = 14;

export const MAP_ITEM_MARKER_COLOR = "#f97316";

export const MAP_ITEM_MARKER_CLASS = "sheet-map-item-marker";

export const MAP_ITEM_MARKER_SELECTED_CLASS = "sheet-map-item-marker--selected";

export const mapItemMarkerDefaultStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
} as const;

/** Google Maps–style user location palette. */
export const MAP_LOCATION_MARKER_SIZE_PX = 12;

export const MAP_USER_LOCATION_RADIUS_PX = MAP_LOCATION_MARKER_SIZE_PX / 2;

export const MAP_USER_LOCATION_COLOR = "#1a73e8";

/** Saturated halo tint — same hue as the core dot. */
export const MAP_USER_LOCATION_HALO_COLOR = "#1a73e8";

export const MAP_USER_LOCATION_HALO_OPACITY = 0.28;

export const MAP_USER_LOCATION_HALO_OPACITY_IDLE = 0.16;

export const mapUserLocationHaloPaint = {
  "circle-color": MAP_USER_LOCATION_HALO_COLOR,
  "circle-opacity": MAP_USER_LOCATION_HALO_OPACITY,
  "circle-blur": 0.45,
  "circle-stroke-width": 0,
} as const;

export const mapUserLocationMarkerPaint = {
  "circle-radius": MAP_USER_LOCATION_RADIUS_PX,
  "circle-color": MAP_USER_LOCATION_COLOR,
  "circle-opacity": 1,
  "circle-stroke-width": 0,
} as const;
