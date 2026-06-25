import { useEffect, useRef } from "react";

import { useMapShellContext } from "../shell/map-route-context";
import { useMapShellSlots } from "../shell/map-shell-slots-context";
import { DefaultMapSheetListItem } from "./default-map-sheet-list-item";
import { orderSheetListItems } from "./order-sheet-list-items";
import type { MapItem } from "./types";

export type MapSheetListProps = {
  items: MapItem[];
};

/** Sheet list from route items — selection, ordering, and tap wiring from shell context. */
export function MapSheetList({ items }: MapSheetListProps) {
  const { selectedItemId, selectItem, sheetSnap } = useMapShellContext();
  const { renderSheetListItem } = useMapShellSlots();
  const rowRefs = useRef(new Map<string, HTMLLIElement>());

  const orderedItems = orderSheetListItems(items, selectedItemId, sheetSnap);

  useEffect(() => {
    if (sheetSnap !== "full" || !selectedItemId) {
      return;
    }

    const element = rowRefs.current.get(selectedItemId);
    element?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedItemId, sheetSnap]);

  const setRowRef = (id: string) => (element: HTMLLIElement | null) => {
    if (element) {
      rowRefs.current.set(id, element);
      return;
    }
    rowRefs.current.delete(id);
  };

  return (
    <ul className="sheet-map-sheet-list">
      {orderedItems.map((item) => {
        const selected = selectedItemId === item.id;
        const onPress = () => {
          selectItem(item.id, item.location);
        };
        const ctx = { selected, onPress, sheetSnap };

        return (
          <li
            key={item.id}
            ref={setRowRef(item.id)}
            className="sheet-map-sheet-list__row"
          >
            {renderSheetListItem?.(item, ctx) ?? (
              <DefaultMapSheetListItem
                item={item}
                selected={selected}
                onPress={onPress}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
