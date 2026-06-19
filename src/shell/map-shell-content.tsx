import type { GeoJsonProperties } from "geojson";
import type { ReactNode } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import {
  BottomSheet,
  type BottomSheetSnap,
} from "../bottom-sheet/bottom-sheet";
import { BottomSheetCollapsedLayers } from "../bottom-sheet/bottom-sheet-collapsed-layers";
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
import {
  buildSheetMapDrawerStyle,
  hasTabBarClearance,
} from "./sheet-map-drawer-style";

const MAP_VIEWPORT_CLASS = "h-full min-h-[100dvh]";

export type MapShellContentProps = {
  mapToken: string;
  publishMapInstance: (map: MapRef | null) => void;
  sheetSnap: BottomSheetSnap;
  onSheetSnapChange: (snap: BottomSheetSnap) => void;
  onSheetContentRef: (node: HTMLDivElement | null) => void;
  onSnapHeightsChange: (heights: {
    collapsedHeightPx: number;
    fullHeightPx: number;
  }) => void;
  isDraggingSheet: boolean;
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
  peekContent: ReactNode;
  expandedContent: ReactNode;
  overlayTopLeft?: ReactNode;
  overlayTopRight?: ReactNode;
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
  onSheetContentRef,
  onSnapHeightsChange,
  isDraggingSheet,
  onDragInteractionChange,
  userLocation,
  isUserLocationFocused,
  onUserLocationPress,
  onMarkerPress,
  extraInteractiveLayerIds,
  onLayerFeaturePress,
  mapChildren,
  peekContent,
  expandedContent,
  overlayTopLeft,
  overlayTopRight,
  myLocationButton = true,
  viewport,
  config = {},
  slots = {},
}: MapShellContentProps) {
  const isCollapsed = sheetSnap === "collapsed";
  const myLocationAriaLabel = config.myLocationAriaLabel ?? "Focus my location";
  const layout = config.layout ?? {};
  const { drawer: drawerStyle, drawerHandle: drawerHandleStyle } =
    buildSheetMapDrawerStyle(layout, config.styles);
  const reserveTabBar = hasTabBarClearance(layout);

  return (
    <div className={`relative min-h-0 flex-1 ${MAP_VIEWPORT_CLASS}`}>
      <MapCanvas
        accessToken={mapToken}
        reuseMaps={false}
        publishMapInstance={publishMapInstance}
        onMarkerPress={onMarkerPress}
        extraInteractiveLayerIds={extraInteractiveLayerIds}
        onLayerFeaturePress={onLayerFeaturePress}
        onUserLocationPress={onUserLocationPress}
        className="absolute inset-0 z-0"
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
        {overlayTopLeft}
        {myLocationButton && userLocation
          ? (slots.renderMyLocationButton?.({
              ariaLabel: myLocationAriaLabel,
              onPress: onUserLocationPress,
              focused: isUserLocationFocused,
            }) ?? (
              <div className="pointer-events-auto absolute bottom-3 left-3">
                <MapMyLocationButton
                  ariaLabel={myLocationAriaLabel}
                  onPress={onUserLocationPress}
                  focused={isUserLocationFocused}
                />
              </div>
            ))
          : null}
        {overlayTopRight}
      </MapVisibleAreaOverlay>

      {config.debug ? (
        <MapVisibleAreaDebug clientRect={viewport.clientRect} />
      ) : null}

      <BottomSheet
        snap={sheetSnap}
        defaultSnap="collapsed"
        onSnapChange={onSheetSnapChange}
        onDragInteractionChange={onDragInteractionChange}
        contentRef={onSheetContentRef}
        collapsedBottomInsetPx={config.collapsedBottomInsetPx}
        halfSnapFraction={config.halfSnapFraction}
        drawerStyle={drawerStyle}
        drawerHandleStyle={drawerHandleStyle}
        onSnapHeightsChange={onSnapHeightsChange}
      >
        <BottomSheetCollapsedLayers
          isCollapsed={isCollapsed}
          revealExpandedWhileCollapsed={isDraggingSheet}
          peek={peekContent}
          expanded={expandedContent}
          reserveTabBar={reserveTabBar}
        />
      </BottomSheet>
    </div>
  );
}
