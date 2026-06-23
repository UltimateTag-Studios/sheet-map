import type { MapItem, MapItemLocation } from "../items/types";

export function pressSelectableMapFeature(
  id: string,
  items: MapItem[],
  selectItem: (id: string, location: MapItemLocation | null) => void,
): void {
  const item = items.find((entry) => entry.id === id);
  if (!item?.location) {
    return;
  }

  selectItem(id, item.location);
}
