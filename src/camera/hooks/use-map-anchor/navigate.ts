import { type RefObject, useCallback, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import { moveCameraProgrammatic } from "../../movement";
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
  onReleaseFollow?: () => void;
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
  onReleaseFollow,
}: UseMapAnchorNavigateInput): MapAnchorNavigateHandle {
  const { dispatch, sheetPhaseRef } = session;

  const onReleaseFollowRef = useRef(onReleaseFollow);
  onReleaseFollowRef.current = onReleaseFollow;

  const navigateToRef = useRef<
    (position: MapPosition, options?: NavigateToMapAnchorOptions) => boolean
  >(() => false);

  const navigateTo = useCallback(
    (
      position: MapPosition,
      options: NavigateToMapAnchorOptions = {},
    ): boolean => {
      if (!mapRef) {
        return false;
      }

      if (!options.keepFollowing) {
        onReleaseFollowRef.current?.();
      }

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
        session.stateRef.current.anchor,
        position,
      );

      dispatch({ type: "setAnchor", position: anchorPosition });
      if (duration > 0) {
        dispatch({ type: "flyStarted" });
      }

      followThresholdExceededRef.current = false;

      return moveCameraProgrammatic({
        mapRef,
        position,
        duration,
        onBeforeCamera: () => {
          refreshMapPaddingFromCanvasRef.current({ realign: false });
        },
      });
    },
    [
      mapRef,
      mapPaddingDebug,
      session.stateRef,
      dispatch,
      sheetPhaseRef,
      refreshMapPaddingFromCanvasRef,
      followThresholdExceededRef,
    ],
  );

  navigateToRef.current = navigateTo;

  return { navigateTo, navigateToRef };
}
