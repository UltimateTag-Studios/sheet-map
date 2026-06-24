import type { SheetSnap } from "@siegetag/sheet";

import type { MapAnchorSession } from "../../camera";
import type { MapItemLocation } from "../../items/types";
import type { SheetMotionPhase } from "../../viewport";
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

export type MapShellMachineState = {
  commandedSnap: SheetSnap;
  layoutSnap: SheetSnap;
  sheetMotionPhase: SheetMotionPhase;
  selectedItemId: string | null;
  cameraSnapshot: MapShellCameraSnapshot;
  intent: ShellIntent | null;
  routeVisit: RouteEntryVisit | null;
};

export function createInitialMapShellMachineState(): MapShellMachineState {
  return {
    commandedSnap: "collapsed",
    layoutSnap: "collapsed",
    sheetMotionPhase: "idle",
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

export function sheetMotionIdle(state: MapShellMachineState): boolean {
  return state.sheetMotionPhase === "idle";
}

export function sheetAndPaddingReady(state: MapShellMachineState): boolean {
  return (
    state.sheetMotionPhase === "idle" && state.cameraSnapshot.mapPaddingReady
  );
}

export function layoutSnapMatchesIntent(
  state: MapShellMachineState,
  sheetTarget: SheetSnap | null,
): boolean {
  if (sheetTarget === null) {
    return true;
  }
  return state.layoutSnap === sheetTarget;
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
    layoutSnapMatchesIntent(state, intent.sheetTarget)
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
