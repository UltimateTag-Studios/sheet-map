import { buildSheetStyle, Sheet, type SheetSnap } from "@siegetag/sheet";
import type { GeoJsonProperties } from "geojson";
import type { ReactNode } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import {
  MapCanvas,
  MapMyLocationButton,
  MapUserLocation,
  MapVisibleAreaDebug,
  MapVisibleAreaOverlay,
} from "../canvas";
import type { MapViewportSyncState } from "../canvas/viewport/use-map-viewport-sync";
import type {
  MapShellConfig,
  MapShellSlots,
  MapUserLocationCoords,
} from "./config";
import { MapSheetLayout } from "./map-sheet-layout";

const MAP_VIEWPORT_CLASS = "sheet-map-viewport";

export type MapShellContentProps = {
  mapToken: string;
  publishMapInstance: (map: MapRef | null) => void;
  sheetSnap: SheetSnap;
  onSheetSnapChange: (snap: SheetSnap) => void;
  onSnapHeightsChange: (heights: {
    collapsedHeightPx: number;
    fullHeightPx: number;
  }) => void;
  onDragInteractionChange: (isDragging: boolean) => void;
  userLocation?: MapUserLocationCoords;
  isUserLocationFocused: boolean;
  onUserLocationPress: () => void;
  onMarkerPress?: (markerId: string) => void;
  extraInteractiveLayerIds?: string[];
  onLayerFeaturePress?: (
    layerId: string,
    properties: GeoJsonProperties,
  ) => void;
  mapChildren: ReactNode;
  header: ReactNode;
  body: ReactNode;
  overlay?: ReactNode;
  myLocationButton?: boolean;
  viewport: MapViewportSyncState;
  config?: MapShellConfig;
  slots?: MapShellSlots;
};

export function MapShellContent({
  mapToken,
  publishMapInstance,
  sheetSnap,
  onSheetSnapChange,
  onSnapHeightsChange,
  onDragInteractionChange,
  userLocation,
  isUserLocationFocused,
  onUserLocationPress,
  onMarkerPress,
  extraInteractiveLayerIds,
  onLayerFeaturePress,
  mapChildren,
  header,
  body,
  overlay,
  myLocationButton = true,
  viewport,
  config = {},
  slots = {},
}: MapShellContentProps) {
  const myLocationAriaLabel = config.myLocationAriaLabel ?? "Focus my location";
  const layout = config.layout ?? {};
  const { sheet: sheetStyle, sheetHandle: sheetHandleStyle } = buildSheetStyle(
    layout,
    config.styles,
  );
  return (
    <div className={`sheet-map-shell ${MAP_VIEWPORT_CLASS}`}>
      <MapCanvas
        accessToken={mapToken}
        reuseMaps={false}
        publishMapInstance={publishMapInstance}
        onMarkerPress={onMarkerPress}
        extraInteractiveLayerIds={extraInteractiveLayerIds}
        onLayerFeaturePress={onLayerFeaturePress}
        onUserLocationPress={onUserLocationPress}
        className="sheet-map-canvas-layer"
      >
        {mapChildren}
        {userLocation
          ? (slots.renderUserLocation?.({
              longitude: userLocation.lng,
              latitude: userLocation.lat,
              accuracyMeters: userLocation.accuracyMeters,
              focused: isUserLocationFocused,
            }) ?? (
              <MapUserLocation
                longitude={userLocation.lng}
                latitude={userLocation.lat}
                accuracyMeters={userLocation.accuracyMeters}
                focused={isUserLocationFocused}
              />
            ))
          : null}
      </MapCanvas>

      <MapVisibleAreaOverlay clientRect={viewport.clientRect}>
        {overlay}
        {myLocationButton && userLocation
          ? (slots.renderMyLocationButton?.({
              ariaLabel: myLocationAriaLabel,
              onPress: onUserLocationPress,
              focused: isUserLocationFocused,
            }) ?? (
              <div className="sheet-map-overlay-slot--bottom-left">
                <MapMyLocationButton
                  ariaLabel={myLocationAriaLabel}
                  onPress={onUserLocationPress}
                  focused={isUserLocationFocused}
                />
              </div>
            ))
          : null}
      </MapVisibleAreaOverlay>

      {config.debug ? (
        <MapVisibleAreaDebug clientRect={viewport.clientRect} />
      ) : null}

      <Sheet
        snap={sheetSnap}
        defaultSnap="collapsed"
        onSnapChange={onSheetSnapChange}
        onDragInteractionChange={onDragInteractionChange}
        collapsedBottomInsetPx={config.collapsedBottomInsetPx}
        halfSnapFraction={config.halfSnapFraction}
        sheetStyle={sheetStyle}
        sheetHandleStyle={sheetHandleStyle}
        onSnapHeightsChange={onSnapHeightsChange}
      >
        <MapSheetLayout
          sheetSnap={sheetSnap}
          header={header}
          body={body}
          bottomChromeReserve={layout.bottomChromeReserve}
        />
      </Sheet>
    </div>
  );
}
