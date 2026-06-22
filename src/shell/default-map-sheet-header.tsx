import type { MapSheetHeaderProps } from "./config";

export function DefaultMapSheetHeader({
  eyebrow,
  title,
  countLabel,
}: MapSheetHeaderProps) {
  return (
    <div className="sheet-map-sheet-header">
      {eyebrow ? (
        <p className="sheet-map-sheet-header__eyebrow">{eyebrow}</p>
      ) : null}
      <div className="sheet-map-sheet-header__title-row">
        <h2 className="sheet-map-sheet-header__title">{title}</h2>
        {countLabel ? (
          <span className="sheet-map-sheet-header__count">{countLabel}</span>
        ) : null}
      </div>
    </div>
  );
}
