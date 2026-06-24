import type { SheetSnap } from "@siegetag/sheet";

import {
  type ItemSelectCamera,
  idleItemSelectCamera,
} from "./item-select-camera";

export type MapShellSelectionState = {
  sheetSnap: SheetSnap;
  selectedItemId: string | null;
  itemSelectCamera: ItemSelectCamera;
};

export function createInitialMapShellSelectionState(): MapShellSelectionState {
  return {
    sheetSnap: "collapsed",
    selectedItemId: null,
    itemSelectCamera: idleItemSelectCamera(),
  };
}
