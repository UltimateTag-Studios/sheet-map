import type { ReactNode } from "react";
import { Marker } from "react-map-gl/mapbox";

import {
  MAP_ITEM_DOT_CLASS,
  MAP_ITEM_DOT_SELECTED_CLASS,
  mapItemDotStyle,
} from "../dot/style";

export type MapItemDotRenderProps = {
  latitude: number;
  longitude: number;
  selected: boolean;
};

export type MapItemDotProps = {
  latitude: number;
  longitude: number;
  selected?: boolean;
  onPress?: () => void;
  renderMarker?: (props: MapItemDotRenderProps) => ReactNode;
};

/** Default map-item marker (orange dot). Override with `renderMarker` for custom UI. */
export function MapItemDot({
  latitude,
  longitude,
  selected = false,
  onPress,
  renderMarker,
}: MapItemDotProps) {
  if (renderMarker) {
    return renderMarker({ latitude, longitude, selected });
  }

  const className = selected
    ? `${MAP_ITEM_DOT_CLASS} ${MAP_ITEM_DOT_SELECTED_CLASS}`
    : MAP_ITEM_DOT_CLASS;

  return (
    <Marker longitude={longitude} latitude={latitude} anchor="center">
      <button
        type="button"
        className={className}
        style={mapItemDotStyle}
        aria-label="Map item"
        aria-pressed={selected}
        onClick={(event) => {
          event.stopPropagation();
          onPress?.();
        }}
      >
        <span className="sheet-map-item-dot__core" aria-hidden />
      </button>
    </Marker>
  );
}
