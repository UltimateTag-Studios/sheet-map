import {
  tabBarCollapsedAreaPaddingBottom,
  tabBarScrollAreaPaddingBottom,
} from "@siegetag/ui";
import type { ReactNode } from "react";
import { useCallback } from "react";

import type { BottomSheetSnap } from "./bottom-sheet";
import { SheetMapDivider } from "./divider";
import { usePeekMeasureRef } from "./peek-measure-context";
import { SheetMapHandleSpacer } from "./peek-spacers";
import {
  isSheetScrollEnabled,
  SHEET_DRAG_ROOT_CLASS,
  SHEET_SCROLL_ROOT_CLASS,
} from "./sheet-scroll-mode";
import { useVaulScrollHandoff } from "./vaul-scroll-handoff";

export type BottomSheetCollapsedLayersProps = {
  sheetSnap: BottomSheetSnap;
  /** Sheet is resting at the collapsed snap. */
  isCollapsed: boolean;
  /** User is dragging while collapsed — reveal expanded content under the peek. */
  revealExpandedWhileCollapsed: boolean;
  peek: ReactNode;
  expanded: ReactNode;
  /** Floating tab bar bottom padding (`config.layout.reserveFloatingTabBar`). */
  reserveFloatingTabBar?: boolean;
};

/**
 * Keeps peek layout in flow at the collapsed snap while expanded content stays
 * mounted in an overlay. Toggle visibility with opacity only so Vaul keeps
 * pointer capture during drag.
 *
 * At full snap one scroll root wraps peek + divider + body. See
 * `useVaulScrollHandoff` for Vaul drag vs scroll at scroll top.
 */
export function BottomSheetCollapsedLayers({
  sheetSnap,
  isCollapsed,
  revealExpandedWhileCollapsed,
  peek,
  expanded,
  reserveFloatingTabBar = false,
}: BottomSheetCollapsedLayersProps) {
  const onPeekMeasure = usePeekMeasureRef();
  const scrollEnabled = isSheetScrollEnabled(
    sheetSnap,
    revealExpandedWhileCollapsed,
  );
  const { scrollRootRef } = useVaulScrollHandoff(scrollEnabled);

  const peekMeasureRef = useCallback(
    (node: HTMLDivElement | null) => {
      onPeekMeasure(node);
    },
    [onPeekMeasure],
  );

  const showCollapsedPeek = isCollapsed && !revealExpandedWhileCollapsed;
  const collapsedPeekPadding = reserveFloatingTabBar
    ? { paddingBottom: tabBarCollapsedAreaPaddingBottom() }
    : undefined;
  const scrollRootPadding = reserveFloatingTabBar
    ? { paddingBottom: tabBarScrollAreaPaddingBottom() }
    : undefined;

  const collapsedPeek = (
    <div style={collapsedPeekPadding}>
      {peek}
      <SheetMapHandleSpacer />
    </div>
  );

  const openPeek = (
    <div className="shrink-0">
      {peek}
      <SheetMapHandleSpacer />
    </div>
  );

  const openSheetContent = scrollEnabled ? (
    <div
      ref={scrollRootRef}
      className={SHEET_SCROLL_ROOT_CLASS}
      data-sheet-scroll-root
      style={scrollRootPadding}
    >
      {openPeek}
      <SheetMapDivider />
      {expanded}
    </div>
  ) : (
    <div className={SHEET_DRAG_ROOT_CLASS}>
      {openPeek}
      <SheetMapDivider />
      <div className="flex min-h-0 flex-1 flex-col">{expanded}</div>
    </div>
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
