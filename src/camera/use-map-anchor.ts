import type { MapEventOf } from "mapbox-gl";
import type { Dispatch, MutableRefObject } from "react";
import { useCallback, useEffect, useReducer, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import type { PixelPoint } from "../viewport/types/pixel";
import type { MapAnchorEvent } from "./anchor";
import {
  createInitialMapAnchorState,
  flyToMapAnchor,
  isAtMapAnchorPosition,
  jumpToMapAnchor,
  readMapAnchorPosition,
  reduceMapAnchor,
} from "./anchor";
import type { MapPosition } from "./map-position";
import {
  readUserLocationFollowDistancePx,
  USER_LOCATION_FOLLOW_THRESHOLD_PX,
} from "./map-user-location-follow";

export type NavigateToMapAnchorOptions = {
  duration?: number;
};

export type MapAnchorFollowOptions = {
  userLocation: { lat: number; lng: number };
  centerOffset: PixelPoint;
  onSnapBack: () => void;
  onExceedThreshold: () => void;
  thresholdPx?: number;
};

export type UseMapAnchorOptions = {
  mapRef: MapRef | null;
  /** When false, skip boot sampling and gesture listeners. */
  enabled?: boolean;
  /** When set, user pans within threshold snap back instead of committing anchor. */
  follow?: MapAnchorFollowOptions | null;
};

type SmoothNavigationState = {
  duration: number;
  hasMoved: boolean;
};

function isUserMapGestureEvent(
  event: MapEventOf<"dragstart"> | MapEventOf<"zoomstart">,
): boolean {
  return (
    event != null &&
    typeof event === "object" &&
    "originalEvent" in event &&
    event.originalEvent != null
  );
}

function settleProgrammaticMoveEnd(
  map: ReturnType<MapRef["getMap"]>,
  mapRef: MapRef,
  anchor: MapPosition | null,
  smoothNavigationRef: MutableRefObject<SmoothNavigationState | null>,
  dispatch: Dispatch<MapAnchorEvent>,
): void {
  if (map.isMoving()) {
    return;
  }

  if (anchor && !isAtMapAnchorPosition(map, anchor)) {
    const smoothNavigation = smoothNavigationRef.current;
    if (smoothNavigation && !smoothNavigation.hasMoved) {
      flyToMapAnchor(mapRef, anchor, {
        duration: smoothNavigation.duration,
      });
      return;
    }

    jumpToMapAnchor(mapRef, anchor);
  }

  smoothNavigationRef.current = null;
  dispatch({ type: "programmaticSettled" });
}

function settleUserGestureMoveEnd(
  map: ReturnType<MapRef["getMap"]>,
  followRef: MutableRefObject<MapAnchorFollowOptions | null | undefined>,
  followThresholdExceededRef: MutableRefObject<boolean>,
  dispatch: Dispatch<MapAnchorEvent>,
): void {
  if (map.isMoving()) {
    return;
  }

  const activeFollow = followRef.current;
  if (activeFollow && !followThresholdExceededRef.current) {
    const distancePx = readUserLocationFollowDistancePx(
      map,
      activeFollow.centerOffset,
      activeFollow.userLocation,
    );
    const thresholdPx =
      activeFollow.thresholdPx ?? USER_LOCATION_FOLLOW_THRESHOLD_PX;

    if (distancePx <= thresholdPx) {
      activeFollow.onSnapBack();
      return;
    }

    activeFollow.onExceedThreshold();
  }

  dispatch({
    type: "userGestureSettled",
    position: readMapAnchorPosition(map),
  });
}

export function useMapAnchor({
  mapRef,
  enabled = true,
  follow = null,
}: UseMapAnchorOptions) {
  const [state, dispatch] = useReducer(
    reduceMapAnchor,
    undefined,
    createInitialMapAnchorState,
  );
  const stateRef = useRef(state);
  stateRef.current = state;
  const followRef = useRef(follow);
  followRef.current = follow;
  const followThresholdExceededRef = useRef(false);
  const smoothNavigationRef = useRef<SmoothNavigationState | null>(null);

  const setAnchor = useCallback((position: MapPosition) => {
    dispatch({ type: "setAnchor", position });
  }, []);

  const navigateTo = useCallback(
    (
      position: MapPosition,
      options: NavigateToMapAnchorOptions = {},
    ): boolean => {
      if (!mapRef) {
        return false;
      }

      const map = mapRef.getMap();
      if (!map.isStyleLoaded()) {
        return false;
      }

      const duration = options.duration ?? 0;

      dispatch({ type: "setAnchor", position });
      dispatch({ type: "navigationStarted" });

      stateRef.current = {
        ...stateRef.current,
        anchor: position,
        session: "programmatic",
      };

      smoothNavigationRef.current =
        duration > 0 ? { duration, hasMoved: false } : null;

      flyToMapAnchor(mapRef, position, options);
      return true;
    },
    [mapRef],
  );

  useEffect(() => {
    if (!mapRef || !enabled) {
      return;
    }

    const map = mapRef.getMap();

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
      const thresholdPx =
        activeFollow.thresholdPx ?? USER_LOCATION_FOLLOW_THRESHOLD_PX;

      if (distancePx > thresholdPx) {
        followThresholdExceededRef.current = true;
        activeFollow.onExceedThreshold();
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

    const handleDragStart = (event: MapEventOf<"dragstart">) => {
      beginUserGesture(event);
    };

    const handleZoomStart = (event: MapEventOf<"zoomstart">) => {
      beginUserGesture(event);
    };

    const handleMove = () => {
      if (
        stateRef.current.session === "programmatic" &&
        smoothNavigationRef.current
      ) {
        smoothNavigationRef.current.hasMoved = true;
      }

      checkFollowThresholdDuringGesture();
    };

    const handleMoveEnd = () => {
      const { session, anchor } = stateRef.current;

      if (session === "programmatic") {
        settleProgrammaticMoveEnd(
          map,
          mapRef,
          anchor,
          smoothNavigationRef,
          dispatch,
        );
        return;
      }

      if (session !== "userGesture") {
        return;
      }

      settleUserGestureMoveEnd(
        map,
        followRef,
        followThresholdExceededRef,
        dispatch,
      );
    };

    const attachListeners = () => {
      bootAnchor();
      map.on("dragstart", handleDragStart);
      map.on("zoomstart", handleZoomStart);
      map.on("move", handleMove);
      map.on("moveend", handleMoveEnd);
    };

    if (map.isStyleLoaded()) {
      attachListeners();
    } else {
      map.once("load", attachListeners);
    }

    return () => {
      map.off("load", attachListeners);
      map.off("dragstart", handleDragStart);
      map.off("zoomstart", handleZoomStart);
      map.off("move", handleMove);
      map.off("moveend", handleMoveEnd);
    };
  }, [mapRef, enabled]);

  return {
    anchor: state.anchor,
    session: state.session,
    setAnchor,
    navigateTo,
  };
}
