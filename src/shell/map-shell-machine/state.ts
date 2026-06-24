import type { SheetSnap } from "@siegetag/sheet";

import type { MapAnchorSession } from "../../camera";
import type { MapItemLocation } from "../../items/types";
import type { SheetMotionPhase } from "../../viewport";
import type { RouteEnterFly } from "./route-enter-fly";

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
    }
  | {
      /** Fly queued until sheet gesture motion returns to idle. */
      status: "pendingFly";
      location: MapItemLocation;
    };

/** Snapshot from map camera, sheet gesture, and route enter-fly subsystems. */
export type MapShellEnvironment = {
  cameraSession: MapAnchorSession;
  sheetMotionPhase: SheetMotionPhase;
  mapPaddingReady: boolean;
  hasUserLocation: boolean;
};

/**
 * Route camera entry lifecycle for the current visit:
 *
 * - `waiting` — entry declared; not dispatched yet (data loading or gates closed)
 * - `dispatched` — fly / select sent once for this entry
 * - `satisfied` — entry goal met for this visit
 * - `dismissed` — user explicitly cleared selection on this visit
 */
export type RouteEntryApplyStatus =
  | "waiting"
  | "dispatched"
  | "satisfied"
  | "dismissed";

export type RouteEntryVisit = {
  routeKey: string;
  entry: RouteEnterFly | null;
  applyStatus: RouteEntryApplyStatus;
};

export type MapShellMachineState = {
  sheetSnap: SheetSnap;
  selectedItemId: string | null;
  environment: MapShellEnvironment;
  itemSelect: ItemSelectPhase;
  routeVisit: RouteEntryVisit | null;
};

export function createInitialMapShellMachineState(): MapShellMachineState {
  return {
    sheetSnap: "collapsed",
    selectedItemId: null,
    environment: {
      cameraSession: "idle",
      sheetMotionPhase: "idle",
      mapPaddingReady: false,
      hasUserLocation: false,
    },
    itemSelect: { status: "idle" },
    routeVisit: null,
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
