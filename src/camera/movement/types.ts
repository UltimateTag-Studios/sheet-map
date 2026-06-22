import type { Map as MapboxMap } from "mapbox-gl";
import type { MapRef } from "react-map-gl/mapbox";

import type { MapPosition } from "../shared/map-position";

/** Programmatic fly/jump — stops momentum by default; caller owns session FSM. */
export type MoveCameraProgrammaticInput = {
  mapRef: MapRef;
  position: MapPosition;
  duration?: number;
  /** When true (default), calls `map.stop()` before the camera move. */
  stopUserMotion?: boolean;
  /** After stop — e.g. sync padding with `realign: false`. */
  onBeforeCamera?: (map: MapboxMap) => void;
  currentAnchor?: MapPosition | null;
  /** Keeps stored anchor in sync when padding triggers an instant realign. */
  updateAnchor?: (position: MapPosition) => void;
};
