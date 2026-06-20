import type { GeoJsonProperties } from "geojson";
import { useCallback, useMemo, useSyncExternalStore } from "react";

import { buildPointListCameraIntent } from "../camera/map-camera-intent";
import { useMapCameraSync } from "../camera/use-map-camera-sync";
import { notifyMapTouchProbeLocationPress } from "../debug/use-map-touch-probe";
import type { MapShellSlots } from "./config";
import { MapLoadingState } from "./map-loading-state";
import type { MapRouteContentStore } from "./map-route-content-store";
import type { MapShellState } from "./map-route-context";
import { MapScreenErrorBoundary } from "./map-screen-error-boundary";
import { MapShellContent } from "./map-shell-content";
import { pressSelectableMapFeature } from "./press-selectable-map-feature";

const MAP_VIEWPORT_CLASS = "sheet-map-viewport";

export type MapShellProps = {
  shell: MapShellState;
  routeContentStore: MapRouteContentStore;
  mapTokenMissingMessage?: string;
  slots?: MapShellSlots;
};

export function MapShell({
  shell,
  routeContentStore,
  mapTokenMissingMessage = "Map token is missing.",
  slots = {},
}: MapShellProps) {
  const routeContent = useSyncExternalStore(
    routeContentStore.subscribe,
    routeContentStore.getContent,
  );

  const {
    mapToken,
    mapRef,
    publishMapInstance,
    sheetSnap,
    handleSheetSnapChange,
    handleSnapHeightsChange,
    setIsDraggingSheet,
    userLocation,
    viewport,
    followUser,
    dismissPointSelection,
    focusPoint,
    startFollowingUser,
    config,
  } = shell;

  const selectablePoints = routeContent?.selectablePoints ?? [];

  const cameraIntent = useMemo(
    () =>
      buildPointListCameraIntent({
        cameraAnchor: shell.cameraAnchor,
        userLocation,
        points: selectablePoints,
        cameraEpoch: shell.cameraEpoch,
      }),
    [shell.cameraAnchor, userLocation, selectablePoints, shell.cameraEpoch],
  );

  useMapCameraSync({
    mapRef,
    intent: cameraIntent,
    viewport,
    settled: shell.viewportSettled,
    initialZoom: config.initialZoom,
    smoothFlyDurationMs: config.smoothFlyDurationMs,
    debug: config.debug === true,
    onFulfilled: shell.handleCameraFulfilled,
  });

  const handleMarkerPress = useCallback(
    (markerId: string) => {
      pressSelectableMapFeature(markerId, selectablePoints, focusPoint);
    },
    [selectablePoints, focusPoint],
  );

  const resolveFeatureId = routeContent?.resolveFeatureId;

  const handleLayerFeaturePress = useCallback(
    (layerId: string, properties: GeoJsonProperties) => {
      const featureId = resolveFeatureId?.(layerId, properties);
      if (!featureId) {
        return;
      }
      pressSelectableMapFeature(featureId, selectablePoints, focusPoint);
    },
    [resolveFeatureId, selectablePoints, focusPoint],
  );

  const handleUserLocationPress = useCallback(() => {
    if (config.debug) {
      notifyMapTouchProbeLocationPress();
    }
    startFollowingUser();
  }, [config.debug, startFollowingUser]);

  if (!mapToken) {
    return (
      slots.renderTokenMissing?.(mapTokenMissingMessage) ?? (
        <MapLoadingState
          message={mapTokenMissingMessage}
          className={MAP_VIEWPORT_CLASS}
        />
      )
    );
  }

  return (
    <MapScreenErrorBoundary>
      <MapShellContent
        mapToken={mapToken}
        publishMapInstance={publishMapInstance}
        sheetSnap={sheetSnap}
        onSheetSnapChange={handleSheetSnapChange}
        onSnapHeightsChange={handleSnapHeightsChange}
        onDragInteractionChange={setIsDraggingSheet}
        userLocation={userLocation}
        mapChildren={routeContent?.mapLayers ?? null}
        header={routeContent?.header ?? null}
        body={routeContent?.body ?? null}
        overlay={routeContent?.overlay}
        collapsedTopRight={routeContent?.collapsedTopRight}
        onDismissSelectionPress={dismissPointSelection}
        onMarkerPress={handleMarkerPress}
        extraInteractiveLayerIds={routeContent?.extraInteractiveLayerIds}
        onLayerFeaturePress={
          resolveFeatureId ? handleLayerFeaturePress : undefined
        }
        isUserLocationFocused={followUser}
        onUserLocationPress={handleUserLocationPress}
        viewport={viewport}
        config={config}
        slots={slots}
      />
    </MapScreenErrorBoundary>
  );
}
