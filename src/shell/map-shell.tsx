import type { GeoJsonProperties } from "geojson";
import { useCallback, useSyncExternalStore } from "react";

import type { MapShellSlots } from "./config";
import { MAP_VIEWPORT_CLASS } from "./map-frame";
import { MapLoadingState } from "./map-loading-state";
import type { MapRouteContentStore } from "./map-route-content-store";
import type { MapShellState } from "./map-route-context";
import { MapScreenErrorBoundary } from "./map-screen-error-boundary";
import { MapShellContent } from "./map-shell-content";
import {
  MapShellSlotsProvider,
  mergeMapShellSlots,
} from "./map-shell-slots-context";
import {
  resolveRouteActionChrome,
  resolveRouteBody,
  resolveRouteHeader,
  resolveRouteMapLayers,
  resolveRouteOverlay,
} from "./resolve-route-chrome";

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
    publishMapInstance,
    sheetSnap,
    handleSheetSnapChange,
    handleSheetSnapSettled,
    onSheetLayoutFrameChange,
    userLocation,
    viewport,
    selectItem,
    recenterOnUser,
    closeSheet,
    userTracking,
    config,
    tracking,
  } = shell;

  const handleMarkerPress = useCallback(
    (markerId: string) => {
      // 6D wires pressSelectableMapFeature + item locations.
      selectItem(markerId, null);
    },
    [selectItem],
  );

  const resolveFeatureId = routeContent?.resolveFeatureId;

  const handleLayerFeaturePress = useCallback(
    (layerId: string, properties: GeoJsonProperties) => {
      const featureId = resolveFeatureId?.(layerId, properties);
      if (!featureId) {
        return;
      }
      selectItem(featureId, null);
    },
    [resolveFeatureId, selectItem],
  );

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

  const mergedSlots = mergeMapShellSlots(slots, routeContent?.slots);

  const overlay = resolveRouteOverlay(routeContent, mergedSlots, {
    clientRect: viewport.clientRect,
    tracking,
  });

  const header = resolveRouteHeader(routeContent, mergedSlots);
  const defaultBody = <div className="sheet-map-sheet-body-placeholder" />;
  const body = resolveRouteBody(routeContent, mergedSlots, defaultBody);
  const mapChildren = resolveRouteMapLayers(routeContent);
  const actionChrome = resolveRouteActionChrome(routeContent, mergedSlots, {
    sheetSnap,
    closeSheet,
    closeAriaLabel: config.closeSheetAriaLabel,
  });

  return (
    <MapScreenErrorBoundary>
      <MapShellSlotsProvider slots={mergedSlots}>
        <MapShellContent
          mapToken={mapToken}
          publishMapInstance={publishMapInstance}
          sheetSnap={sheetSnap}
          onSheetSnapChange={handleSheetSnapChange}
          onSheetSnapSettled={handleSheetSnapSettled}
          onSheetLayoutFrameChange={onSheetLayoutFrameChange}
          userLocation={userLocation}
          userTracking={userTracking}
          recenterOnUser={recenterOnUser}
          mapChildren={mapChildren}
          header={header}
          body={body}
          overlay={overlay ?? undefined}
          actionChrome={actionChrome}
          onMarkerPress={handleMarkerPress}
          extraInteractiveLayerIds={routeContent?.extraInteractiveLayerIds}
          onLayerFeaturePress={
            resolveFeatureId ? handleLayerFeaturePress : undefined
          }
          viewport={viewport}
          config={config}
          slots={mergedSlots}
        />
      </MapShellSlotsProvider>
    </MapScreenErrorBoundary>
  );
}
