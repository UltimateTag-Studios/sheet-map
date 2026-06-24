import type { SheetSnap } from "@siegetag/sheet";

import type { MapAnchorSession } from "../../camera/anchor/state";
import type { MapItemLocation } from "../../items/types";
import type { SheetMotionPhase } from "../../viewport";

/** Item-select camera + sheet open sequencing. */
export type ItemSelectPhase =
  | { status: "idle" }
  | {
      status: "flyThenOpen";
      location: MapItemLocation;
      cameraStage: "pending" | "inFlight";
    };

export type MapShellMachineState = {
  sheetSnap: SheetSnap;
  selectedItemId: string | null;
  sheetMotionPhase: SheetMotionPhase;
  cameraSession: MapAnchorSession;
  itemSelect: ItemSelectPhase;
};

export function createInitialMapShellMachineState(): MapShellMachineState {
  return {
    sheetSnap: "collapsed",
    selectedItemId: null,
    sheetMotionPhase: "idle",
    cameraSession: "idle",
    itemSelect: { status: "idle" },
  };
}

export function isSheetReadyAtHalf(state: MapShellMachineState): boolean {
  return state.sheetSnap === "half" && state.sheetMotionPhase === "idle";
}

export function isSheetMotionIdle(state: MapShellMachineState): boolean {
  return state.sheetMotionPhase === "idle";
}
