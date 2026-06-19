import type { PixelPoint } from "../canvas/viewport/map-viewport";

export const USER_LOCATION_FOLLOW_THRESHOLD_PX = 40;

type UserLocationCoords = {
  lng: number;
  lat: number;
};

export function userLocationCenterDistancePx(
  project: (coords: [number, number]) => { x: number; y: number },
  canvasSize: { width: number; height: number },
  centerOffset: PixelPoint,
  userLocation: UserLocationCoords,
): number {
  const projected = project([userLocation.lng, userLocation.lat]);
  const centerX = canvasSize.width / 2 + centerOffset.x;
  const centerY = canvasSize.height / 2 + centerOffset.y;
  const dx = projected.x - centerX;
  const dy = projected.y - centerY;
  return Math.sqrt(dx * dx + dy * dy);
}
