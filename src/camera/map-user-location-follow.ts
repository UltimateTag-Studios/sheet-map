import type { PixelPoint } from "../viewport/types/pixel";

export const USER_LOCATION_FOLLOW_THRESHOLD_PX = 40;

export type UserLocationCoords = {
  lng: number;
  lat: number;
};

type MapFollowDistanceSource = {
  project: (coords: [number, number]) => { x: number; y: number };
  getCanvas: () => { clientWidth: number; clientHeight: number };
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

export function readUserLocationFollowDistancePx(
  map: MapFollowDistanceSource,
  centerOffset: PixelPoint,
  userLocation: UserLocationCoords,
): number {
  const canvas = map.getCanvas();
  return userLocationCenterDistancePx(
    (coords) => map.project(coords),
    { width: canvas.clientWidth, height: canvas.clientHeight },
    centerOffset,
    userLocation,
  );
}
