import { type RefObject, useCallback, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import {
  applyMapAnchorCamera,
  beginProgrammaticNavigation,
  type NavigationIntent,
  reduceMapAnchor,
} from "../../anchor";
import { canNavigateMap } from "../../shared/can-navigate-map";
import {
  type MapPosition,
  mergeMapAnchorPosition,
} from "../../shared/map-position";
import type { MapAnchorSessionRefs } from "./session-refs";
import type {
  NavigateToMapAnchorOptions,
  RefreshMapPaddingFromCanvasOptions,
} from "./types";

export type UseMapAnchorNavigateInput = {
  mapRef: MapRef | null;
  mapPaddingDebug: boolean;
  session: MapAnchorSessionRefs;
  refreshMapPaddingFromCanvasRef: RefObject<
    (options?: RefreshMapPaddingFromCanvasOptions) => boolean
  >;
  followThresholdExceededRef: RefObject<boolean>;
};

export type MapAnchorNavigateHandle = {
  navigateTo: (
    position: MapPosition,
    options?: NavigateToMapAnchorOptions,
  ) => boolean;
  navigateToRef: RefObject<
    (position: MapPosition, options?: NavigateToMapAnchorOptions) => boolean
  >;
};

export function useMapAnchorNavigate({
  mapRef,
  mapPaddingDebug,
  session,
  refreshMapPaddingFromCanvasRef,
  followThresholdExceededRef,
}: UseMapAnchorNavigateInput): MapAnchorNavigateHandle {
  const { stateRef, dispatch, sheetPhaseRef } = session;

  const navigateToRef = useRef<
    (position: MapPosition, options?: NavigateToMapAnchorOptions) => boolean
  >(() => false);

  const navigateTo = useCallback(
    (
      position: MapPosition,
      options: NavigateToMapAnchorOptions = {},
    ): boolean => {
      if (!canNavigateMap(mapRef)) {
        return false;
      }

      const map = mapRef.getMap();

      const requestedDuration = options.duration ?? 0;
      const sheetMoving = sheetPhaseRef.current !== "idle";
      const duration = sheetMoving ? 0 : requestedDuration;

      if (mapPaddingDebug) {
        const mode = duration > 0 ? "fly" : "jump";
        console.info(`[map-navigate] ${mode}`, {
          duration,
          requestedDuration,
          sheetPhase: sheetPhaseRef.current,
          ...(mode === "jump" && sheetMoving ? { reason: "sheet moving" } : {}),
        });
      }

      const anchorPosition = mergeMapAnchorPosition(
        stateRef.current.anchor,
        position,
      );
      const intent: NavigationIntent = { target: position };

      let nextState = reduceMapAnchor(stateRef.current, {
        type: "setAnchor",
        position: anchorPosition,
      });
      nextState = reduceMapAnchor(nextState, {
        type: "navigationStarted",
        intent,
      });
      stateRef.current = nextState;

      dispatch({ type: "setAnchor", position: anchorPosition });
      dispatch({ type: "navigationStarted", intent });

      followThresholdExceededRef.current = false;

      beginProgrammaticNavigation(map, () => {
        refreshMapPaddingFromCanvasRef.current({ realign: false });
      });
      applyMapAnchorCamera(mapRef, position, { duration });
      return true;
    },
    [
      mapRef,
      mapPaddingDebug,
      stateRef,
      dispatch,
      sheetPhaseRef,
      refreshMapPaddingFromCanvasRef,
      followThresholdExceededRef,
    ],
  );

  navigateToRef.current = navigateTo;

  return { navigateTo, navigateToRef };
}
