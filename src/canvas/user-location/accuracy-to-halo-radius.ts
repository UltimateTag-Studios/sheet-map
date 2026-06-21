import { MAP_USER_LOCATION_RADIUS_PX } from "../dot/style";

export const MAP_USER_LOCATION_MIN_HALO_RADIUS_PX =
  MAP_USER_LOCATION_RADIUS_PX * 2;

export const MAP_USER_LOCATION_MAX_HALO_RADIUS_PX = 120;

export function mapMetersPerPixel(latitude: number, zoom: number): number {
  return (
    (40_075_016.686 * Math.cos((latitude * Math.PI) / 180)) / (256 * 2 ** zoom)
  );
}

export function accuracyMetersToHaloRadiusPx(
  accuracyMeters: number | null | undefined,
  latitude: number,
  zoom: number | null,
): number {
  if (
    zoom === null ||
    accuracyMeters == null ||
    !Number.isFinite(accuracyMeters)
  ) {
    return MAP_USER_LOCATION_MIN_HALO_RADIUS_PX;
  }

  const radiusPx = accuracyMeters / mapMetersPerPixel(latitude, zoom);
  return Math.min(
    MAP_USER_LOCATION_MAX_HALO_RADIUS_PX,
    Math.max(MAP_USER_LOCATION_MIN_HALO_RADIUS_PX, radiusPx),
  );
}
