/** Invisible circle tap target diameter in CSS pixels (Mapbox `circle-radius` = diameter / 2). */
export function mapMarkerHitLayerPaintForDiameter(hitDiameterPx: number) {
  return {
    "circle-radius": hitDiameterPx / 2,
    "circle-opacity": 0,
  } as const;
}

/** Default Mapbox hit-layer diameter when layout vars are unavailable. */
export const MAP_MARKER_HIT_SIZE_PX = 32;

export const mapMarkerHitLayerPaint = mapMarkerHitLayerPaintForDiameter(
  MAP_MARKER_HIT_SIZE_PX,
);
