import type { MapEventOf } from "mapbox-gl";
import { useEffect } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import {
  isUserMapGestureEvent,
  readMapAnchorPosition,
  resolveMoveEnd,
  trySettleNavigatingSession,
} from "../../anchor";
import {
  consumePaddingSyncMoveEnd,
  drainPaddingSyncMoveEnd,
} from "../../padding/sync";
import type { MapAnchorSessionRefs } from "./session-refs";

const mapListenerCleanupByMap = new WeakMap<
  ReturnType<MapRef["getMap"]>,
  () => void
>();

export type UseMapAnchorListenersInput = {
  mapRef: MapRef | null;
  enabled: boolean;
  session: MapAnchorSessionRefs;
};

export function useMapAnchorListeners({
  mapRef,
  enabled,
  session,
}: UseMapAnchorListenersInput): void {
  const { stateRef, dispatch, sheetMotionActiveRef } = session;

  useEffect(() => {
    if (!mapRef || !enabled) {
      return;
    }

    const map = mapRef.getMap();
    mapListenerCleanupByMap.get(map)?.();

    const bootAnchor = () => {
      if (stateRef.current.anchor !== null) {
        return;
      }

      dispatch({
        type: "setAnchor",
        position: readMapAnchorPosition(map),
      });
    };

    const beginUserGesture = (
      event: MapEventOf<"dragstart"> | MapEventOf<"zoomstart">,
    ) => {
      if (!isUserMapGestureEvent(event)) {
        return;
      }

      dispatch({ type: "userGestureStarted" });
    };

    const handleMoveEnd = () => {
      const resolution = resolveMoveEnd({
        paddingMoveEnd: consumePaddingSyncMoveEnd(map),
        isMoving: map.isMoving(),
        session: stateRef.current.session,
        readPosition: () => readMapAnchorPosition(map),
      });

      if (resolution.kind === "noop") {
        return;
      }

      if (resolution.kind === "userGestureSettled") {
        dispatch({
          type: "userGestureSettled",
          position: resolution.position,
        });
        return;
      }

      trySettleNavigatingSession(map, stateRef, sheetMotionActiveRef, dispatch);
    };

    const attachListeners = () => {
      drainPaddingSyncMoveEnd(map);
      bootAnchor();
      map.on("dragstart", beginUserGesture);
      map.on("zoomstart", beginUserGesture);
      map.on("moveend", handleMoveEnd);
    };

    if (map.isStyleLoaded()) {
      attachListeners();
    } else {
      map.once("load", attachListeners);
    }

    const cleanup = () => {
      map.off("load", attachListeners);
      map.off("dragstart", beginUserGesture);
      map.off("zoomstart", beginUserGesture);
      map.off("moveend", handleMoveEnd);
    };

    mapListenerCleanupByMap.set(map, cleanup);

    return () => {
      mapListenerCleanupByMap.delete(map);
      cleanup();
    };
  }, [mapRef, enabled, stateRef, dispatch, sheetMotionActiveRef]);
}
