export type SheetMapPeekSpacersProps = {
  /** When true, renders safe-area + tab bar clearance spacer below handle spacer. */
  reserveTabBar?: boolean;
};

/** Structural spacers after user peek content — handle mirror + optional tab bar clearance. */
export function SheetMapPeekSpacers({
  reserveTabBar = false,
}: SheetMapPeekSpacersProps) {
  return (
    <>
      <div aria-hidden className="sheet-map-handle-spacer shrink-0" />
      {reserveTabBar ? (
        <div aria-hidden className="sheet-map-tab-bar-spacer shrink-0" />
      ) : null}
    </>
  );
}
