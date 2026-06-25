import type { SheetLayoutFrameChange, SheetSnap } from "@siegetag/sheet";

import type { MapAnchorSession } from "../../camera";
import type { MapItemLocation } from "../../items/types";
import type { RouteEnterFly } from "./route-enter-fly";

export type ShellCameraIntent =
  | {
      kind: "flyToItem";
      location: MapItemLocation;
      enterFly?: boolean;
      zoom?: number;
    }
  | { kind: "flyToUser"; zoom?: number };

export type ShellIntent =
  | {
      phase: "awaitGates";
      itemId: string | null;
      camera: ShellCameraIntent;
      sheetTarget: SheetSnap | null;
      openHalfAfterFly?: boolean;
    }
  | {
      phase: "awaitCameraIdleForHalf";
      itemId: string;
    };

export type MapShellCameraSnapshot = {
  cameraSession: MapAnchorSession;
  mapPaddingReady: boolean;
  hasUserLocation: boolean;
  anchorZoom: number | null;
  defaultEnterFlyZoom: number;
};

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

/** Shell motion axis — maps from Sheet `idle` → `resting` at the event boundary. */
export type MapShellSheetPhase = "resting" | "dragging" | "settling";

export type MapShellMachineState = {
  /** Last snap the sheet has arrived at — updates on `sheetSettled` only. */
  sheetSnap: SheetSnap;
  /** Destination while transitioning; `null` when resting with no in-flight command. */
  sheetTarget: SheetSnap | null;
  sheetPhase: MapShellSheetPhase;
  selectedItemId: string | null;
  cameraSnapshot: MapShellCameraSnapshot;
  intent: ShellIntent | null;
  routeVisit: RouteEntryVisit | null;
};

export function createInitialMapShellMachineState(): MapShellMachineState {
  return {
    sheetSnap: "collapsed",
    sheetTarget: null,
    sheetPhase: "resting",
    selectedItemId: null,
    cameraSnapshot: {
      cameraSession: "idle",
      mapPaddingReady: false,
      hasUserLocation: false,
      anchorZoom: null,
      defaultEnterFlyZoom: 14,
    },
    intent: null,
    routeVisit: null,
  };
}

export function mapShellPhaseFromSheet(
  phase: SheetLayoutFrameChange["phase"],
): MapShellSheetPhase {
  switch (phase) {
    case "idle":
      return "resting";
    case "dragging":
      return "dragging";
    case "settling":
      return "settling";
  }
}

export function sheetPropSnap(state: MapShellMachineState): SheetSnap {
  return state.sheetTarget ?? state.sheetSnap;
}

/** In motion → plan from destination; resting → plan from arrival. */
export function snapForPlanning(state: MapShellMachineState): SheetSnap {
  if (state.sheetPhase !== "resting") {
    return state.sheetTarget ?? state.sheetSnap;
  }
  return state.sheetSnap;
}

export function sheetPhaseResting(state: MapShellMachineState): boolean {
  return state.sheetPhase === "resting";
}

export function sheetAndPaddingReady(state: MapShellMachineState): boolean {
  return state.sheetPhase === "resting" && state.cameraSnapshot.mapPaddingReady;
}

export function sheetSnapMatchesIntent(
  state: MapShellMachineState,
  sheetTarget: SheetSnap | null,
): boolean {
  if (sheetTarget === null) {
    return true;
  }
  return state.sheetSnap === sheetTarget;
}

export function intentReadyForCameraFly(state: MapShellMachineState): boolean {
  const intent = state.intent;
  if (!intent || intent.phase !== "awaitGates") {
    return false;
  }

  if (
    intent.camera.kind === "flyToUser" &&
    !state.cameraSnapshot.hasUserLocation
  ) {
    return false;
  }

  return (
    sheetAndPaddingReady(state) &&
    sheetSnapMatchesIntent(state, intent.sheetTarget)
  );
}

export function cameraSnapshotsEqual(
  a: MapShellCameraSnapshot,
  b: MapShellCameraSnapshot,
): boolean {
  return (
    a.cameraSession === b.cameraSession &&
    a.mapPaddingReady === b.mapPaddingReady &&
    a.hasUserLocation === b.hasUserLocation &&
    a.anchorZoom === b.anchorZoom &&
    a.defaultEnterFlyZoom === b.defaultEnterFlyZoom
  );
}
