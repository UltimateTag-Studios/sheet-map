import type { Map as MapboxMap } from "mapbox-gl";
import type { Dispatch, RefObject } from "react";

import { isAtMapAnchorPosition } from "./is-at-position";
import type { MapAnchorEvent } from "./reduce";
import type { MapAnchorState } from "./state";

export function trySettleFlyingSession(
  map: MapboxMap,
  stateRef: RefObject<MapAnchorState>,
  sheetMotionActiveRef: RefObject<boolean>,
  dispatch: Dispatch<MapAnchorEvent>,
): void {
  const { session, anchor } = stateRef.current;
  if (session !== "flying") {
    return;
  }

  if (sheetMotionActiveRef.current) {
    return;
  }

  if (map.isMoving()) {
    return;
  }

  if (!anchor || !isAtMapAnchorPosition(map, anchor)) {
    return;
  }

  dispatch({ type: "flySettled" });
}
