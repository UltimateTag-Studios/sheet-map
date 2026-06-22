export type MapPosition = {
  lat: number;
  lng: number;
  /** When set on navigateTo, Mapbox applies this zoom; when omitted, current zoom is preserved. */
  zoom?: number;
};

export function positionKey(position: MapPosition): string {
  const zoomPart =
    position.zoom !== undefined ? position.zoom.toFixed(3) : "preserve";
  return `${position.lng.toFixed(6)}:${position.lat.toFixed(6)}:${zoomPart}`;
}

/** Merge navigate target into stored anchor — preserve zoom unless target sets it. */
export function mergeMapAnchorPosition(
  current: MapPosition | null,
  next: MapPosition,
): MapPosition {
  return {
    lat: next.lat,
    lng: next.lng,
    zoom:
      next.zoom !== undefined
        ? next.zoom
        : current?.zoom !== undefined
          ? current.zoom
          : undefined,
  };
}
