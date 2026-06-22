import type { Map as MapboxMap } from "mapbox-gl";

import type { MapObscuredInsets } from "../../viewport";
import type { MapPaddingOptions } from "./compute";
import { readMapPaddingFromCanvas } from "./read-from-canvas";
import {
  hasSyncedMapPadding,
  readSyncedMapPadding,
  syncMapPadding,
} from "./sync";

export type SyncMapPaddingFromCanvasInput = {
  map: MapboxMap;
  fixedChromeInsets?: Partial<MapObscuredInsets>;
  debug?: boolean;
};

export type SyncMapPaddingFromCanvasResult = {
  changed: boolean;
  padding: MapPaddingOptions | null;
  mapPaddingSynced: boolean;
};

/**
 * Read live sheet DOM via the map canvas and apply Mapbox padding when it changed.
 * Does not call jumpTo / flyTo / stop.
 */
export function syncMapPaddingFromCanvas({
  map,
  fixedChromeInsets,
  debug = false,
}: SyncMapPaddingFromCanvasInput): SyncMapPaddingFromCanvasResult {
  if (!map.isStyleLoaded()) {
    return {
      changed: false,
      padding: readSyncedMapPadding(map) ?? null,
      mapPaddingSynced: hasSyncedMapPadding(map),
    };
  }

  const nextPadding = readMapPaddingFromCanvas({
    canvas: map.getCanvas(),
    fixedChromeInsets,
  });
  if (!nextPadding) {
    return {
      changed: false,
      padding: readSyncedMapPadding(map) ?? null,
      mapPaddingSynced: hasSyncedMapPadding(map),
    };
  }

  const changed = syncMapPadding(map, nextPadding);

  if (debug && changed) {
    console.info("[map-padding-from-canvas] setPadding", nextPadding);
  }

  return {
    changed,
    padding: readSyncedMapPadding(map) ?? nextPadding,
    mapPaddingSynced: hasSyncedMapPadding(map),
  };
}
