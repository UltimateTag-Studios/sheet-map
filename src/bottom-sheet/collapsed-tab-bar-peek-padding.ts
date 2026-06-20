import type { BottomSheetSnap } from "./bottom-sheet";

const COLLAPSED_HEIGHT_EPSILON_PX = 2;

/** Peek bottom padding so collapsed content clears the floating tab bar. */
export function showCollapsedTabBarPeekPadding(args: {
  reserveFloatingTabBar: boolean;
  sheetSnap: BottomSheetSnap;
  isDragging: boolean;
  visibleHeightPx: number;
  collapsedHeightPx: number;
}): boolean {
  if (!args.reserveFloatingTabBar) {
    return false;
  }

  if (!args.isDragging) {
    return args.sheetSnap === "collapsed";
  }

  return (
    args.visibleHeightPx <= args.collapsedHeightPx + COLLAPSED_HEIGHT_EPSILON_PX
  );
}
