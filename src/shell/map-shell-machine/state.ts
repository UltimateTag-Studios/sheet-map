import type { SheetSnap } from "@siegetag/sheet";

export type MapShellSelectionState = {
  sheetSnap: SheetSnap;
  selectedItemId: string | null;
};

export function createInitialMapShellSelectionState(): MapShellSelectionState {
  return {
    sheetSnap: "collapsed",
    selectedItemId: null,
  };
}
