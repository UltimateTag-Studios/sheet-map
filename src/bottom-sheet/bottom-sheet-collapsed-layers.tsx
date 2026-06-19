import type { ReactNode } from "react";
import { useCallback } from "react";

import { SheetMapDivider } from "./divider";
import { usePeekMeasureRef } from "./peek-measure-context";
import { SheetMapPeekSpacers } from "./peek-spacers";

export type BottomSheetCollapsedLayersProps = {
  /** Sheet is resting at the collapsed snap. */
  isCollapsed: boolean;
  /** User is dragging while collapsed — reveal expanded content under the peek. */
  revealExpandedWhileCollapsed: boolean;
  peek: ReactNode;
  expanded: ReactNode;
  /** Renders tab bar clearance spacer after peek (from `config.layout.tabBarClearance`). */
  reserveTabBar?: boolean;
};

/**
 * Keeps peek layout in flow at the collapsed snap while expanded content stays
 * mounted in an overlay. Toggle visibility with opacity only so Vaul keeps
 * pointer capture during drag.
 *
 * Peek height for snap points is measured from an off-layout probe — not the
 * visible flex column — so flex-1 stretch cannot inflate collapsed height.
 */
export function BottomSheetCollapsedLayers({
  isCollapsed,
  revealExpandedWhileCollapsed,
  peek,
  expanded,
  reserveTabBar = false,
}: BottomSheetCollapsedLayersProps) {
  const onPeekMeasure = usePeekMeasureRef();

  const peekMeasureRef = useCallback(
    (node: HTMLDivElement | null) => {
      onPeekMeasure(node);
    },
    [onPeekMeasure],
  );

  const showCollapsedPeek = isCollapsed && !revealExpandedWhileCollapsed;

  /** Collapsed snap: peek + handle spacer + optional tab bar spacer. */
  const collapsedPeek = (
    <>
      {peek}
      <SheetMapPeekSpacers reserveTabBar={reserveTabBar} />
    </>
  );

  /** Half / full (and drag-reveal): peek + spacer, divider, scroll body. */
  const openSheetContent = (
    <>
      <div className="shrink-0">
        {peek}
        <SheetMapPeekSpacers />
      </div>
      <SheetMapDivider />
      <div className="flex min-h-0 flex-1 flex-col">{expanded}</div>
    </>
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={peekMeasureRef}
        aria-hidden
        className="pointer-events-none invisible absolute top-0 w-full"
      >
        {collapsedPeek}
      </div>

      {isCollapsed ? (
        <>
          <div
            className={
              showCollapsedPeek
                ? "w-full shrink-0"
                : "pointer-events-none opacity-0"
            }
            aria-hidden={!showCollapsedPeek}
          >
            {collapsedPeek}
          </div>
          <div
            className={`sheet-map-expanded-overlay absolute inset-x-0 top-0 z-10 flex min-h-0 flex-col ${
              showCollapsedPeek ? "pointer-events-none opacity-0" : ""
            }`.trim()}
            aria-hidden={showCollapsedPeek}
          >
            {openSheetContent}
          </div>
        </>
      ) : (
        openSheetContent
      )}
    </div>
  );
}
