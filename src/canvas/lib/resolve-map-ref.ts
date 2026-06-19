import type { MapRef } from "react-map-gl/mapbox";

export function resolveMapRef(
  maps: Partial<Record<string, MapRef | null>> | null | undefined,
): MapRef | null {
  if (!maps) {
    return null;
  }

  return maps.current ?? maps.default ?? null;
}
