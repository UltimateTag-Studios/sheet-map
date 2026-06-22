import type { MapEventOf } from "mapbox-gl";
import { type RefObject, useEffect, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import {
  evaluateFollowAtGestureSettle,
  isUserMapGestureEvent,
  type MapAnchorFollowConfig,
  readMapAnchorPosition,
  resolveMoveEnd,
  trySettleNavigatingSession,
} from "../../anchor";
import {
  consumePaddingSyncMoveEnd,
  drainPaddingSyncMoveEnd,
} from "../../padding/sync";
import type { MapPosition } from "../../shared/map-position";
import { readUserLocationFollowDistancePx } from "../../shared/user-location-follow-distance";
import type { MapAnchorSessionRefs } from "./session-refs";
import type { NavigateToMapAnchorOptions } from "./types";

const mapListenerCleanupByMap = new WeakMap<
  ReturnType<MapRef["getMap"]>,
  () => void
>();

export type UseMapAnchorListenersInput = {
  mapRef: MapRef | null;
  enabled: boolean;
  session: MapAnchorSessionRefs;
  follow: MapAnchorFollowConfig | null;
  onReleaseFollow?: () => void;
  smoothFlyDurationMs: number;
  navigateToRef: RefObject<
    (position: MapPosition, options?: NavigateToMapAnchorOptions) => boolean
  >;
  followThresholdExceededRef: RefObject<boolean>;
};

export function useMapAnchorListeners({
  mapRef,
  enabled,
  session,
  follow,
  onReleaseFollow,
  smoothFlyDurationMs,
  navigateToRef,
  followThresholdExceededRef,
}: UseMapAnchorListenersInput): void {
  const { stateRef, dispatch, sheetMotionActiveRef } = session;

  const followRef = useRef(follow);
  followRef.current = follow;

  const onReleaseFollowRef = useRef(onReleaseFollow);
  onReleaseFollowRef.current = onReleaseFollow;

  const smoothFlyDurationMsRef = useRef(smoothFlyDurationMs);
  smoothFlyDurationMsRef.current = smoothFlyDurationMs;

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

    const checkFollowThresholdDuringGesture = () => {
      if (stateRef.current.session !== "userGesture") {
        return;
      }

      if (followThresholdExceededRef.current) {
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
        followThresholdExceededRef.current = true;
        onReleaseFollowRef.current?.();
      }
    };

    const beginUserGesture = (
      event: MapEventOf<"dragstart"> | MapEventOf<"zoomstart">,
    ) => {
      if (!isUserMapGestureEvent(event)) {
        return;
      }

      followThresholdExceededRef.current = false;
      dispatch({ type: "userGestureStarted" });
    };

    const settleUserGesture = () => {
      const activeFollow = followRef.current;
      const outcome = evaluateFollowAtGestureSettle(
        map,
        activeFollow,
        followThresholdExceededRef.current,
      );

      if (outcome.kind === "snapBackToUser") {
        navigateToRef.current(outcome.target, {
          duration: smoothFlyDurationMsRef.current,
        });
        return;
      }

      if (outcome.kind === "releaseFollow") {
        onReleaseFollowRef.current?.();
      }

      dispatch({
        type: "userGestureSettled",
        position:
          outcome.kind === "commitAnchor"
            ? outcome.position
            : readMapAnchorPosition(map),
      });
    };

    const handleMoveEnd = () => {
      const resolution = resolveMoveEnd({
        paddingMoveEnd: consumePaddingSyncMoveEnd(map),
        isMoving: map.isMoving(),
        session: stateRef.current.session,
        readPosition: () => readMapAnchorPosition(map),
        followContext: activeFollowContext(followRef.current),
      });

      if (resolution.kind === "noop") {
        return;
      }

      if (resolution.kind === "userGestureSettled") {
        if (followRef.current) {
          settleUserGesture();
          return;
        }

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
      map.on("move", checkFollowThresholdDuringGesture);
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
      map.off("move", checkFollowThresholdDuringGesture);
      map.off("moveend", handleMoveEnd);
    };

    mapListenerCleanupByMap.set(map, cleanup);

    return () => {
      mapListenerCleanupByMap.delete(map);
      cleanup();
    };
  }, [
    mapRef,
    enabled,
    stateRef,
    dispatch,
    sheetMotionActiveRef,
    navigateToRef,
    followThresholdExceededRef,
  ]);
}

function activeFollowContext(
  follow: MapAnchorFollowConfig | null,
): { followUser: boolean; followReleaseThresholdPx: number } | undefined {
  if (!follow) {
    return undefined;
  }

  return {
    followUser: true,
    followReleaseThresholdPx: follow.thresholdPx,
  };
}
