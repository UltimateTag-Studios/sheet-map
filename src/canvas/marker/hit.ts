/** Invisible circle tap target for map markers (items, path points, user location). */
export const MAP_MARKER_HIT_SIZE_PX = 32;

export const mapMarkerHitLayerPaint = {
  "circle-radius": MAP_MARKER_HIT_SIZE_PX / 2,
  "circle-opacity": 0,
} as const;
