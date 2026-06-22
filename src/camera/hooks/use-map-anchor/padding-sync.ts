import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { MapRef } from "react-map-gl/mapbox";

import type { MapObscuredInsets } from "../../../viewport";
import { applyMapPadding } from "../../padding/apply";
import type { MapPaddingOptions } from "../../padding/compute";
import { syncMapPaddingFromCanvas } from "../../padding/sync-from-canvas";
import type { MapPosition } from "../../shared/map-position";
import { whenMapStyleReady } from "../../shared/when-map-style-ready";
import type { MapAnchorSessionRefs } from "./session-refs";
import type { RefreshMapPaddingFromCanvasOptions } from "./types";

export type UseMapPaddingSyncInput = {
  mapRef: MapRef | null;
  enabled: boolean;
  mapPaddingFromCanvasEnabled: boolean;
  liveSheetObscuredBottomPx?: number;
  fixedChromeInsets?: Partial<MapObscuredInsets>;
  mapPaddingDebug: boolean;
  session: MapAnchorSessionRefs;
  followUser?: boolean;
  followTarget?: MapPosition | null;
  /** Called once when the first live-DOM padding sync succeeds. */
  onPaddingReady?: () => void;
};

export type MapPaddingSyncHandle = {
  mapPadding: MapPaddingOptions | null;
  mapPaddingReady: boolean;
  mapPaddingReadyRef: RefObject<boolean>;
  refreshMapPaddingFromCanvasRef: RefObject<
    (options?: RefreshMapPaddingFromCanvasOptions) => boolean
  >;
};

export function useMapPaddingSync({
  mapRef,
  enabled,
  mapPaddingFromCanvasEnabled,
  liveSheetObscuredBottomPx,
  fixedChromeInsets,
  mapPaddingDebug,
  session,
  followUser = false,
  followTarget = null,
  onPaddingReady,
}: UseMapPaddingSyncInput): MapPaddingSyncHandle {
  const { stateRef, sheetPhaseRef, dispatch } = session;

  const [mapPadding, setMapPadding] = useState<MapPaddingOptions | null>(null);
  const [mapPaddingReady, setMapPaddingReady] = useState(
    !mapPaddingFromCanvasEnabled,
  );
  const mapPaddingReadyRef = useRef(mapPaddingReady);

  const refreshMapPaddingFromCanvasRef = useRef<
    (options?: RefreshMapPaddingFromCanvasOptions) => boolean
  >(() => false);

  const onPaddingReadyRef = useRef(onPaddingReady);
  onPaddingReadyRef.current = onPaddingReady;

  const followUserRef = useRef(followUser);
  followUserRef.current = followUser;

  const followTargetRef = useRef(followTarget);
  followTargetRef.current = followTarget;

  const refreshMapPaddingFromCanvas = useCallback(
    (options: RefreshMapPaddingFromCanvasOptions = {}) => {
      if (!mapRef || !enabled || !mapPaddingFromCanvasEnabled) {
        return false;
      }

      const sheetMotionActive = sheetPhaseRef.current !== "idle";

      const result = syncMapPaddingFromCanvas({
        map: mapRef.getMap(),
        fixedChromeInsets,
        debug: mapPaddingDebug,
      });

      if (result.changed && result.padding) {
        setMapPadding(result.padding);
        applyMapPadding({
          mapRef,
          state: stateRef.current,
          paddingChanged: true,
          realign: options.realign,
          sheetMotionActive,
          followUser: followUserRef.current,
          followTarget: followTargetRef.current,
          onRealignAnchor: (position) => {
            dispatch({ type: "setAnchor", position });
          },
          debug: mapPaddingDebug,
        });
      }

      if (result.mapPaddingSynced && !mapPaddingReadyRef.current) {
        mapPaddingReadyRef.current = true;
        setMapPaddingReady(true);
        onPaddingReadyRef.current?.();
      }

      return result.changed;
    },
    [
      mapRef,
      enabled,
      mapPaddingFromCanvasEnabled,
      fixedChromeInsets,
      mapPaddingDebug,
      stateRef,
      sheetPhaseRef,
      dispatch,
    ],
  );

  refreshMapPaddingFromCanvasRef.current = refreshMapPaddingFromCanvas;

  useEffect(() => {
    if (!mapRef || !enabled || !mapPaddingFromCanvasEnabled) {
      mapPaddingReadyRef.current = !mapPaddingFromCanvasEnabled;
      setMapPadding(null);
      setMapPaddingReady(!mapPaddingFromCanvasEnabled);
      return;
    }

    const map = mapRef.getMap();
    mapPaddingReadyRef.current = false;
    setMapPaddingReady(false);

    const cancelWhenStyleReady = whenMapStyleReady(map, () => {
      refreshMapPaddingFromCanvasRef.current();
    });

    return () => {
      cancelWhenStyleReady();
    };
  }, [mapRef, enabled, mapPaddingFromCanvasEnabled]);

  useEffect(() => {
    if (!mapPaddingFromCanvasEnabled) {
      return;
    }

    refreshMapPaddingFromCanvas();
  }, [refreshMapPaddingFromCanvas, mapPaddingFromCanvasEnabled]);

  useEffect(() => {
    if (
      !mapPaddingFromCanvasEnabled ||
      liveSheetObscuredBottomPx === undefined
    ) {
      return;
    }

    refreshMapPaddingFromCanvasRef.current();
  }, [mapPaddingFromCanvasEnabled, liveSheetObscuredBottomPx]);

  useEffect(() => {
    if (
      !mapRef ||
      !enabled ||
      !mapPaddingFromCanvasEnabled ||
      mapPaddingReady
    ) {
      return;
    }

    const map = mapRef.getMap();

    const retryPaddingSync = () => {
      refreshMapPaddingFromCanvasRef.current();
    };

    map.on("idle", retryPaddingSync);
    map.on("resize", retryPaddingSync);

    return () => {
      map.off("idle", retryPaddingSync);
      map.off("resize", retryPaddingSync);
    };
  }, [mapRef, enabled, mapPaddingFromCanvasEnabled, mapPaddingReady]);

  return {
    mapPadding,
    mapPaddingReady,
    mapPaddingReadyRef,
    refreshMapPaddingFromCanvasRef,
  };
}
