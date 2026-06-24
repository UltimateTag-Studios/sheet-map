import type { Map as MapboxMap } from "mapbox-gl";

import { areMapPaddingOptionsEqual, type MapPaddingOptions } from "./compute";

/** Apply Mapbox padding when options differ from the map's current padding. */
export function setMapPaddingIfChanged(
  map: MapboxMap,
  nextPadding: MapPaddingOptions,
): boolean {
  const current = map.getPadding();
  const currentPadding: MapPaddingOptions = {
    top: current.top ?? 0,
    left: current.left ?? 0,
    right: current.right ?? 0,
    bottom: current.bottom ?? 0,
  };

  if (areMapPaddingOptionsEqual(currentPadding, nextPadding)) {
    return false;
  }

  map.setPadding(nextPadding);
  return true;
}
