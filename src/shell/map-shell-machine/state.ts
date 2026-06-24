import type { SheetSnap } from "@siegetag/sheet";

import type { MapAnchorSession } from "../../camera/anchor/state";
import type { MapItemLocation } from "../../items/types";
import type { SheetMotionPhase } from "../../viewport";

/**
 * Item-select orchestration while the sheet stays collapsed (fly-then-open).
 *
 * Completion is driven by `environmentSynced` when the camera reports
 * `flying → idle`.
 */
export type ItemSelectPhase =
  | { status: "idle" }
  | {
      status: "flyingToItem";
      location: MapItemLocation;
    };

/** Snapshot from map camera + sheet gesture subsystems. */
export type MapShellEnvironment = {
  cameraSession: MapAnchorSession;
  sheetMotionPhase: SheetMotionPhase;
};

export type MapShellMachineState = {
  sheetSnap: SheetSnap;
  selectedItemId: string | null;
  environment: MapShellEnvironment;
  itemSelect: ItemSelectPhase;
};

export function createInitialMapShellMachineState(): MapShellMachineState {
  return {
    sheetSnap: "collapsed",
    selectedItemId: null,
    environment: {
      cameraSession: "idle",
      sheetMotionPhase: "idle",
    },
    itemSelect: { status: "idle" },
  };
}

export function isSheetReadyAtHalf(state: MapShellMachineState): boolean {
  return (
    state.sheetSnap === "half" && state.environment.sheetMotionPhase === "idle"
  );
}

export function isSheetMotionIdle(state: MapShellMachineState): boolean {
  return state.environment.sheetMotionPhase === "idle";
}
