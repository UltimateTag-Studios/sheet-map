import { useMapShellContext } from "../shell/map-route-context";
import { useMapShellSlots } from "../shell/map-shell-slots-context";
import { DefaultMapSheetListItem } from "./default-map-sheet-list-item";
import type { MapItem } from "./types";

export type MapSheetListProps = {
  items: MapItem[];
};

/** Sheet list from route items — selection and tap wiring from shell context. */
export function MapSheetList({ items }: MapSheetListProps) {
  const { selectedItemId, selectItem } = useMapShellContext();
  const { renderSheetListItem } = useMapShellSlots();

  return (
    <ul className="sheet-map-sheet-list">
      {items.map((item) => {
        const selected = selectedItemId === item.id;
        const onPress = () => {
          selectItem(item.id, item.location);
        };

        return (
          <li key={item.id} className="sheet-map-sheet-list__row">
            {renderSheetListItem?.(item, selected) ?? (
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
