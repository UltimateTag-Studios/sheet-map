import type { Map as MapboxMap } from "mapbox-gl";
import type { MapRef } from "react-map-gl/mapbox";

import type { MapPosition } from "../shared/map-position";

/** Instant jump — no session, no map.stop(), optional anchor write. */
export type RepositionCameraInput = {
  mapRef: MapRef;
  position: MapPosition;
  currentAnchor: MapPosition | null;
  updateAnchor?: (position: MapPosition) => void;
};

/** Programmatic fly/jump — stops momentum by default; caller owns session FSM. */
export type MoveCameraProgrammaticInput = {
  mapRef: MapRef;
  position: MapPosition;
  duration?: number;
  /** When true (default), calls `map.stop()` before the camera move. */
  stopUserMotion?: boolean;
  /** After stop — e.g. sync padding with `realign: false`. */
  onBeforeCamera?: (map: MapboxMap) => void;
};
