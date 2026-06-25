import { Fragment } from "react";

import { useMapShellContext } from "../shell/map-route-context";
import { useMapShellSlots } from "../shell/map-shell-slots-context";
import { DefaultMapItemMarker } from "./default-map-item-marker";
import type { MapItem } from "./types";

export type MapItemsLayerProps = {
  items: MapItem[];
};

/** One map marker per item with a location — selection from shell context. */
export function MapItemsLayer({ items }: MapItemsLayerProps) {
  const { selectedItemId, selectItem } = useMapShellContext();
  const { renderMapItem } = useMapShellSlots();

  return (
    <>
      {items.map((item) => {
        const selected = selectedItemId === item.id;
        const onPress = () => {
          selectItem(item.id, item.location);
        };

        return (
          <Fragment key={item.id}>
            {renderMapItem?.(item, selected) ?? (
              <DefaultMapItemMarker
                item={item}
                selected={selected}
                onPress={onPress}
              />
            )}
          </Fragment>
        );
      })}
    </>
  );
}
