import type { Map as MapboxMap } from "mapbox-gl";

import type { MapPosition } from "../map-position";

/** Geographic center and zoom from the live Mapbox camera. */
export function readMapAnchorPosition(map: MapboxMap): MapPosition {
  const center = map.getCenter();

  return {
    lat: center.lat,
    lng: center.lng,
    zoom: map.getZoom(),
  };
}
