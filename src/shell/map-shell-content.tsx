import type { SheetLayoutFrameChange } from "@siegetag/sheet";
import { buildSheetStyle, Sheet, type SheetSnap } from "@siegetag/sheet";
import type { GeoJsonProperties } from "geojson";
import type { ReactNode } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import { MapUserTrackingProvider } from "../camera";
import type { useMapUserTracking } from "../camera/hooks/use-map-user-tracking";
import { MapCanvas, MapMyLocationControl, MapUserLocationDot } from "../canvas";
import type { MapViewportSyncState } from "../viewport";
import { MapVisibleAreaDebug, MapVisibleAreaOverlay } from "../viewport";
import type {
  MapShellConfig,
  MapShellSlots,
  MapUserLocationCoords,
} from "./config";
import { MAP_VIEWPORT_CLASS, MapFrame } from "./map-frame";
import { MapSheetLayout } from "./map-sheet-layout";

type UserTrackingValue = ReturnType<typeof useMapUserTracking>;

export type MapShellContentProps = {
  mapToken: string;
  publishMapInstance: (map: MapRef | null) => void;
  sheetSnap: SheetSnap;
  onSheetSnapChange: (snap: SheetSnap) => void;
  onSheetSnapSettled?: (snap: SheetSnap) => void;
  onSheetLayoutFrameChange: (frame: SheetLayoutFrameChange) => void;
  userLocation?: MapUserLocationCoords | null;
  userTracking: UserTrackingValue;
  recenterOnUser: () => void;
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
  topRightChrome?: ReactNode;
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
  onSheetSnapSettled,
  onSheetLayoutFrameChange,
  userLocation,
  userTracking,
  recenterOnUser,
  onMarkerPress,
  extraInteractiveLayerIds,
  onLayerFeaturePress,
  mapChildren,
  header,
  body,
  overlay,
  topRightChrome,
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
  const { tracking, mapPaddingReady } = userTracking;

  const userLocationStyleOverrides =
    userLocation && slots.renderUserLocation
      ? slots.renderUserLocation(
          tracking,
          userLocation.accuracyMeters ?? undefined,
        )
      : null;

  return (
    <MapFrame className={`sheet-map-shell sheet-host ${MAP_VIEWPORT_CLASS}`}>
      <MapUserTrackingProvider value={userTracking}>
        <MapCanvas
          accessToken={mapToken}
          reuseMaps={false}
          publishMapInstance={publishMapInstance}
          onMarkerPress={onMarkerPress}
          extraInteractiveLayerIds={extraInteractiveLayerIds}
          onLayerFeaturePress={onLayerFeaturePress}
          className="sheet-map-canvas-layer"
        >
          {mapChildren}
          <MapUserLocationDot
            styleOverrides={userLocationStyleOverrides ?? undefined}
          />
        </MapCanvas>
      </MapUserTrackingProvider>

      <MapVisibleAreaOverlay clientRect={viewport.clientRect}>
        {overlay}
        {topRightChrome ? (
          <div className="sheet-map-overlay-slot--top-right">
            {topRightChrome}
          </div>
        ) : null}
        {myLocationButton && userLocation && mapPaddingReady
          ? (slots.renderMyLocationButton?.(
              recenterOnUser,
              tracking,
              myLocationAriaLabel,
            ) ?? (
              <div className="sheet-map-overlay-slot--bottom-left">
                <MapMyLocationControl
                  ariaLabel={myLocationAriaLabel}
                  onPress={recenterOnUser}
                  tracking={tracking}
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
        onSnapSettled={onSheetSnapSettled}
        onLayoutFrameChange={onSheetLayoutFrameChange}
        halfSnapFraction={config.halfSnapFraction}
        sheetStyle={sheetStyle}
        sheetHandleStyle={sheetHandleStyle}
      >
        <MapSheetLayout
          header={header}
          body={body}
          bottomChromeReserve={layout.bottomChromeReserve}
        />
      </Sheet>
    </MapFrame>
  );
}
