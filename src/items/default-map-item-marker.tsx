import { MapItemMarker } from "../canvas/item-marker";
import type { MapItem } from "./types";

export type DefaultMapItemMarkerProps = {
  item: MapItem;
  selected: boolean;
  onPress: () => void;
};

/** Default orange map marker for a route item. */
export function DefaultMapItemMarker({
  item,
  selected,
  onPress,
}: DefaultMapItemMarkerProps) {
  return (
    <MapItemMarker
      latitude={item.location.lat}
      longitude={item.location.lng}
      selected={selected}
      onPress={onPress}
    />
  );
}
