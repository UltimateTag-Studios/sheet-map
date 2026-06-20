import type { BottomSheetSnap } from "./bottom-sheet";

/** Unified scroll only at full snap (never while collapsed drag overlay is shown). */
export function isSheetScrollEnabled(
  sheetSnap: BottomSheetSnap,
  revealExpandedWhileCollapsed: boolean,
): boolean {
  return sheetSnap === "full" && !revealExpandedWhileCollapsed;
}

/** Full snap: one scroll root for peek + divider + body. */
export const SHEET_SCROLL_ROOT_CLASS =
  "min-h-0 flex-1 overflow-y-auto overscroll-y-none";

export const SHEET_DRAG_ROOT_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-hidden";
