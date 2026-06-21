export type MapPosition = {
  lat: number;
  lng: number;
  zoom: number;
};

export function positionKey(position: MapPosition): string {
  return `${position.lng.toFixed(6)}:${position.lat.toFixed(6)}:${position.zoom.toFixed(3)}`;
}
