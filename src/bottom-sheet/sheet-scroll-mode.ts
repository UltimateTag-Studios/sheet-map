import type { BottomSheetSnap } from "./bottom-sheet";

/** Body overflow scroll when at full height (live during drag, resting snap when idle). */
export function canBodyScroll(args: {
  sheetSnap: BottomSheetSnap;
  canBodyScrollLive: boolean;
  isDragging: boolean;
}): boolean {
  if (args.isDragging) {
    return args.canBodyScrollLive;
  }
  return args.sheetSnap === "full";
}

export const SHEET_BODY_ROOT_BASE_CLASS = "min-h-0 flex-1 overscroll-y-none";

export const SHEET_BODY_SCROLLABLE_CLASS = "overflow-y-auto";

export const SHEET_BODY_DRAG_CLASS = "overflow-y-hidden touch-action-none";

/** Body scroll root below the fixed peek header. */
export function sheetBodyRootClass(canBodyScroll: boolean): string {
  return `${SHEET_BODY_ROOT_BASE_CLASS} ${
    canBodyScroll ? SHEET_BODY_SCROLLABLE_CLASS : SHEET_BODY_DRAG_CLASS
  }`;
}

export const SHEET_SCROLL_ROOT_CLASS = `${SHEET_BODY_ROOT_BASE_CLASS} ${SHEET_BODY_SCROLLABLE_CLASS}`;
