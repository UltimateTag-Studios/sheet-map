import type { MapEventOf } from "mapbox-gl";
import { type RefObject, useEffect, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import {
  evaluateFollowAtGestureSettle,
  isAtMapAnchorPosition,
  isUserMapGestureEvent,
  type MapAnchorFollowConfig,
  readMapAnchorPosition,
  resolveMoveEnd,
} from "../anchor";
import type { MapCameraMachineDispatch } from "../machine";
import type { MapCameraState } from "../machine/state";
import {
  consumePaddingSyncMoveEnd,
  drainPaddingSyncMoveEnd,
} from "../padding/sync";
import { readUserLocationFollowDistancePx } from "../shared/user-location-follow-distance";

const mapListenerCleanupByMap = new WeakMap<
  ReturnType<MapRef["getMap"]>,
  () => void
>();

export type UseMapboxListenersInput = {
  mapRef: MapRef | null;
  enabled: boolean;
  dispatch: MapCameraMachineDispatch;
  stateRef: RefObject<MapCameraState>;
  follow: MapAnchorFollowConfig | null;
};

export function useMapboxListeners({
  mapRef,
  enabled,
  dispatch,
  stateRef,
  follow,
}: UseMapboxListenersInput): void {
  const followRef = useRef(follow);
  followRef.current = follow;

  useEffect(() => {
    if (!mapRef || !enabled) {
      return;
    }

    const map = mapRef.getMap();
    mapListenerCleanupByMap.get(map)?.();

    const readMoveFacts = () => {
      const anchor = stateRef.current.anchor;
      return {
        position: readMapAnchorPosition(map),
        atAnchor: anchor !== null && isAtMapAnchorPosition(map, anchor),
      };
    };

    const bootAnchor = () => {
      if (stateRef.current.anchor !== null) {
        return;
      }

      dispatch({
        type: "mapStyleReady",
        position: readMapAnchorPosition(map),
      });
    };

    const checkFollowThresholdDuringGesture = () => {
      if (stateRef.current.session !== "userGesture") {
        return;
      }

      if (stateRef.current.followThresholdExceeded) {
        return;
      }

      const activeFollow = followRef.current;
      if (!activeFollow) {
        return;
      }

      const distancePx = readUserLocationFollowDistancePx(
        map,
        activeFollow.centerOffset,
        activeFollow.userLocation,
      );

      if (distancePx > activeFollow.thresholdPx) {
        dispatch({ type: "mapFollowThresholdExceeded" });
      }
    };

    const beginUserGesture = (
      event:
        | MapEventOf<"dragstart">
        | MapEventOf<"zoomstart">
        | MapEventOf<"wheel">,
    ) => {
      if (!isUserMapGestureEvent(event)) {
        return;
      }

      dispatch({ type: "mapGestureBegan" });
    };

    const handleMoveEnd = () => {
      const paddingMoveEnd =
        stateRef.current.padding.suppressNextMoveEnd ||
        consumePaddingSyncMoveEnd(map);

      const resolution = resolveMoveEnd({
        paddingMoveEnd,
        isMoving: map.isMoving(),
        session: stateRef.current.session,
        readPosition: () => readMapAnchorPosition(map),
      });

      if (resolution.kind === "noop") {
        return;
      }

      if (resolution.kind === "userGestureSettled" && followRef.current) {
        const outcome = evaluateFollowAtGestureSettle(
          map,
          followRef.current,
          stateRef.current.followThresholdExceeded,
        );
        dispatch({ type: "gestureSettleResolved", outcome });
        return;
      }

      const facts = readMoveFacts();
      dispatch({
        type: "mapMoveEnd",
        paddingMoveEnd,
        isMoving: map.isMoving(),
        position: facts.position,
        atAnchor: facts.atAnchor,
      });
    };

    const handleMapIdle = () => {
      const facts = readMoveFacts();
      dispatch({
        type: "mapIdle",
        isMoving: map.isMoving(),
        atAnchor: facts.atAnchor,
      });
    };

    const attachListeners = () => {
      drainPaddingSyncMoveEnd(map);
      bootAnchor();
      map.on("dragstart", beginUserGesture);
      map.on("zoomstart", beginUserGesture);
      map.on("wheel", beginUserGesture);
      map.on("move", checkFollowThresholdDuringGesture);
      map.on("moveend", handleMoveEnd);
      map.on("idle", handleMapIdle);
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
      map.off("wheel", beginUserGesture);
      map.off("move", checkFollowThresholdDuringGesture);
      map.off("moveend", handleMoveEnd);
      map.off("idle", handleMapIdle);
    };

    mapListenerCleanupByMap.set(map, cleanup);

    return () => {
      mapListenerCleanupByMap.delete(map);
      cleanup();
    };
  }, [mapRef, enabled, dispatch, stateRef]);
}
