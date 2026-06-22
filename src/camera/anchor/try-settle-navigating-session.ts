import type { Map as MapboxMap } from "mapbox-gl";
import type { Dispatch, MutableRefObject } from "react";

import { isAtMapAnchorPosition } from "./is-at-map-anchor-position";
import type { MapAnchorEvent } from "./reduce-map-anchor";
import type { MapAnchorState } from "./state";

export function trySettleNavigatingSession(
  map: MapboxMap,
  stateRef: MutableRefObject<MapAnchorState>,
  sheetMotionActiveRef: MutableRefObject<boolean>,
  dispatch: Dispatch<MapAnchorEvent>,
): void {
  const { session, anchor } = stateRef.current;
  if (session !== "navigating") {
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

  dispatch({ type: "navigationSettled" });
}
