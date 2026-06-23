import { MapItemDot } from "../canvas/item-dot";
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
  if (!item.location) {
    return null;
  }

  return (
    <MapItemDot
      latitude={item.location.lat}
      longitude={item.location.lng}
      selected={selected}
      onPress={onPress}
    />
  );
}
