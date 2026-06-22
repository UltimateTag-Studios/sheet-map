import type { ReactNode } from "react";
import { Marker } from "react-map-gl/mapbox";

import { MAP_ITEM_DOT_CLASS, mapItemDotStyle } from "../dot/style";

export type MapItemDotRenderProps = {
  latitude: number;
  longitude: number;
};

export type MapItemDotProps = {
  latitude: number;
  longitude: number;
  renderMarker?: (props: MapItemDotRenderProps) => ReactNode;
};

/** Default map-item marker (orange dot). Override with `renderMarker` for custom UI. */
export function MapItemDot({
  latitude,
  longitude,
  renderMarker,
}: MapItemDotProps) {
  if (renderMarker) {
    return renderMarker({ latitude, longitude });
  }

  return (
    <Marker longitude={longitude} latitude={latitude} anchor="center">
      <div className={MAP_ITEM_DOT_CLASS} style={mapItemDotStyle} aria-hidden />
    </Marker>
  );
}
