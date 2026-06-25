import type { SheetSnap } from "@siegetag/sheet";

import type { MapItem } from "./types";

export function orderSheetListItems(
  items: MapItem[],
  selectedItemId: string | null,
  sheetSnap: SheetSnap,
): MapItem[] {
  if (sheetSnap !== "half" || !selectedItemId) {
    return items;
  }

  const selectedIndex = items.findIndex((item) => item.id === selectedItemId);
  if (selectedIndex <= 0) {
    return items;
  }

  const selected = items[selectedIndex];
  if (!selected) {
    return items;
  }

  const rest = items.filter((_, index) => index !== selectedIndex);
  return [selected, ...rest];
}
