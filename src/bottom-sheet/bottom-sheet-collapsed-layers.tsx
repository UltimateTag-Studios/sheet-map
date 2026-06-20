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
import { useSheetBodySnapPan } from "./sheet-body-snap-pan";
import {
  useCanBodyScroll,
  useShowCollapsedTabBarPeekPadding,
} from "./sheet-drag-context";
import { sheetBodyRootClass } from "./sheet-scroll-mode";
import { useVaulScrollHandoff } from "./vaul-scroll-handoff";

export type BottomSheetCollapsedLayersProps = {
  sheetSnap: BottomSheetSnap;
  peek: ReactNode;
  expanded: ReactNode;
  /** Floating tab bar bottom padding (`config.layout.reserveFloatingTabBar`). */
  reserveFloatingTabBar?: boolean;
};

function mergeRefs<T>(
  ...refs: Array<(node: T | null) => void>
): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      ref(node);
    }
  };
}

/**
 * Fixed peek header (Vaul-only) + always-mounted body scroll root below the divider.
 * Collapsed tab bar reserve is peek padding (live height gated); body gets scroll-end padding when expanded.
 */
export function BottomSheetCollapsedLayers({
  sheetSnap,
  peek,
  expanded,
  reserveFloatingTabBar = false,
}: BottomSheetCollapsedLayersProps) {
  const onPeekMeasure = usePeekMeasureRef();
  const canBodyScroll = useCanBodyScroll(sheetSnap);
  const showCollapsedTabBarPeekPadding = useShowCollapsedTabBarPeekPadding(
    sheetSnap,
    reserveFloatingTabBar,
  );
  const { scrollRootRef } = useVaulScrollHandoff(canBodyScroll);
  const { bodyRootRef } = useSheetBodySnapPan(canBodyScroll);
  const bodyRootMergedRef = mergeRefs(scrollRootRef, bodyRootRef);

  const peekMeasureRef = useCallback(
    (node: HTMLDivElement | null) => {
      onPeekMeasure(node);
    },
    [onPeekMeasure],
  );

  const peekPadding = showCollapsedTabBarPeekPadding
    ? { paddingBottom: tabBarCollapsedAreaPaddingBottom() }
    : undefined;
  const innerPadding = reserveFloatingTabBar
    ? { paddingBottom: tabBarScrollAreaPaddingBottom() }
    : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={peekMeasureRef} className="shrink-0" style={peekPadding}>
        {peek}
        <SheetMapHandleSpacer />
      </div>
      <SheetMapDivider />
      <div
        ref={bodyRootMergedRef}
        className={sheetBodyRootClass(canBodyScroll)}
        data-sheet-scroll-root
      >
        <div style={innerPadding}>{expanded}</div>
      </div>
    </div>
  );
}
