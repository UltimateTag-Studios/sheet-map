import type { SheetLayoutFrameChange } from "@siegetag/sheet";
import { buildSheetStyle, Sheet, type SheetSnap } from "@siegetag/sheet";
import type { GeoJsonProperties } from "geojson";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
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
import { MapFrame } from "./map-frame";
import { buildMapLogoHostStyle } from "./map-logo-host-style";
import { MapSheetLayout } from "./map-sheet-layout";
import { resolveMapboxStyleUrl } from "./map-theme";

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

  const [collapsedSheetHeightPx, setCollapsedSheetHeightPx] = useState(0);

  const handleSnapHeightsChange = useCallback(
    (heights: { collapsedHeightPx: number }) => {
      setCollapsedSheetHeightPx(heights.collapsedHeightPx);
    },
    [],
  );

  const hostStyle = buildMapLogoHostStyle(collapsedSheetHeightPx);
  const mapStyleUrl = resolveMapboxStyleUrl(config.theme);

  const userLocationStyleOverrides =
    userLocation && slots.renderUserLocation
      ? slots.renderUserLocation(
          tracking,
          userLocation.accuracyMeters ?? undefined,
        )
      : null;

  return (
    <MapFrame style={hostStyle}>
      <MapUserTrackingProvider value={userTracking}>
        <MapCanvas
          accessToken={mapToken}
          styleUrl={mapStyleUrl}
          reuseMaps={false}
          publishMapInstance={publishMapInstance}
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
        onSnapHeightsChange={handleSnapHeightsChange}
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
