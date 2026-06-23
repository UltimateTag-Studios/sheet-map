import type { MapItem } from "./types";

export type DefaultMapSheetListItemProps = {
  item: MapItem;
  selected: boolean;
  onPress: () => void;
};

/** Default sheet list row — structural styling in sheet-map.css. */
export function DefaultMapSheetListItem({
  item,
  selected,
  onPress,
}: DefaultMapSheetListItemProps) {
  return (
    <button
      type="button"
      className={`sheet-map-sheet-list-item${selected ? " sheet-map-sheet-list-item--selected" : ""}`}
      onClick={onPress}
      aria-label={item.title}
      aria-pressed={selected}
    >
      <span className="sheet-map-sheet-list-item__title">{item.title}</span>
      {item.subtitle ? (
        <span className="sheet-map-sheet-list-item__subtitle">
          {item.subtitle}
        </span>
      ) : null}
      {item.meta ? (
        <span className="sheet-map-sheet-list-item__meta">{item.meta}</span>
      ) : null}
    </button>
  );
}
