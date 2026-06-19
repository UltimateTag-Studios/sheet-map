import { useSyncExternalStore } from "react";

import type { MapShellSlots } from "./config";
import { MapLoadingState } from "./map-loading-state";
import type { MapRouteContentStore } from "./map-route-content-store";
import type { MapShellState } from "./map-route-context";
import { MapScreenErrorBoundary } from "./map-screen-error-boundary";
import { MapShellContent } from "./map-shell-content";

const MAP_VIEWPORT_CLASS = "h-full min-h-[100dvh]";

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

  if (!shell.mapToken) {
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
        mapToken={shell.mapToken}
        publishMapInstance={shell.publishMapInstance}
        sheetSnap={shell.sheetSnap}
        onSheetSnapChange={shell.handleSheetSnapChange}
        onSnapHeightsChange={shell.handleSnapHeightsChange}
        isDraggingSheet={shell.isDraggingSheet}
        onDragInteractionChange={shell.setIsDraggingSheet}
        userLocation={shell.userLocation}
        mapChildren={routeContent?.mapLayers ?? null}
        peekContent={routeContent?.peek ?? null}
        expandedContent={routeContent?.expanded ?? null}
        overlayTopLeft={routeContent?.overlayTopLeft}
        overlayTopRight={routeContent?.overlayTopRight}
        onMarkerPress={routeContent?.onMarkerPress}
        extraInteractiveLayerIds={routeContent?.extraInteractiveLayerIds}
        onLayerFeaturePress={routeContent?.onLayerFeaturePress}
        isUserLocationFocused={routeContent?.isUserLocationFocused ?? false}
        onUserLocationPress={routeContent?.onUserLocationPress ?? (() => {})}
        viewport={shell.viewport}
        config={shell.config}
        slots={slots}
      />
    </MapScreenErrorBoundary>
  );
}
