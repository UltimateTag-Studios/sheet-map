import type { SheetMotionPhase } from "./use-live-sheet-obscured-bottom-px";

/** True while the sheet is dragging or settling (geometry still moving). */
export function isSheetMotionActive(phase: SheetMotionPhase): boolean {
  return phase !== "idle";
}

export function isSheetMotionIdle(phase: SheetMotionPhase): boolean {
  return phase === "idle";
}
