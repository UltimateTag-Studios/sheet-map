import type { ReactNode } from "react";
import { Marker } from "react-map-gl/mapbox";

import {
  MAP_ITEM_MARKER_CLASS,
  MAP_ITEM_MARKER_SELECTED_CLASS,
  mapItemMarkerDefaultStyle,
} from "../marker/style";

export type MapItemMarkerRenderProps = {
  latitude: number;
  longitude: number;
  selected: boolean;
};

export type MapItemMarkerProps = {
  latitude: number;
  longitude: number;
  selected?: boolean;
  onPress?: () => void;
  renderMarker?: (props: MapItemMarkerRenderProps) => ReactNode;
};

/** Default map-item marker (orange pin). Override with `renderMarker` for custom UI. */
export function MapItemMarker({
  latitude,
  longitude,
  selected = false,
  onPress,
  renderMarker,
}: MapItemMarkerProps) {
  if (renderMarker) {
    return renderMarker({ latitude, longitude, selected });
  }

  const className = selected
    ? `${MAP_ITEM_MARKER_CLASS} ${MAP_ITEM_MARKER_SELECTED_CLASS}`
    : MAP_ITEM_MARKER_CLASS;

  return (
    <Marker longitude={longitude} latitude={latitude} anchor="center">
      <button
        type="button"
        className={className}
        style={mapItemMarkerDefaultStyle}
        aria-label="Map item"
        aria-pressed={selected}
        onClick={(event) => {
          event.stopPropagation();
          onPress?.();
        }}
      >
        <span className="sheet-map-item-marker__default" aria-hidden />
      </button>
    </Marker>
  );
}
