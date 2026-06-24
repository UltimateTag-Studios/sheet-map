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

export type ShellIntent = {
  itemId: string | null;
  /** Pending camera move; cleared after the fly effect is emitted. */
  camera: ShellCameraIntent | null;
  /** null = do not change sheet snap (user location). */
  sheetTarget: SheetSnap | null;
  /** Collapsed item select: open half after camera fly completes. */
  openHalfAfterCameraIdle: boolean;
};

/** Snapshot from map camera, sheet gesture, and route enter-fly subsystems. */
export type MapShellEnvironment = {
  cameraSession: MapAnchorSession;
  sheetMotionPhase: SheetMotionPhase;
  /** Live resting snap from sheet layout frames (while moving). */
  physicalSnap: SheetSnap;
  mapPaddingReady: boolean;
  hasUserLocation: boolean;
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
  sheetSnap: SheetSnap;
  reportedSheetSnap: SheetSnap;
  selectedItemId: string | null;
  environment: MapShellEnvironment;
  intent: ShellIntent | null;
  routeVisit: RouteEntryVisit | null;
};

export function createInitialMapShellMachineState(): MapShellMachineState {
  return {
    sheetSnap: "collapsed",
    reportedSheetSnap: "collapsed",
    selectedItemId: null,
    environment: {
      cameraSession: "idle",
      sheetMotionPhase: "idle",
      physicalSnap: "collapsed",
      mapPaddingReady: false,
      hasUserLocation: false,
    },
    intent: null,
    routeVisit: null,
  };
}

export function isSheetMotionIdle(state: MapShellMachineState): boolean {
  return state.environment.sheetMotionPhase === "idle";
}

/** Where the sheet physically rests — settled snap when idle, layout frame while moving. */
export function resolvePhysicalSnap(state: MapShellMachineState): SheetSnap {
  if (isSheetMotionIdle(state)) {
    return state.reportedSheetSnap;
  }
  return state.environment.physicalSnap;
}

export function gatesOpen(environment: MapShellEnvironment): boolean {
  return environment.sheetMotionPhase === "idle" && environment.mapPaddingReady;
}

export function sheetAtTarget(
  state: MapShellMachineState,
  sheetTarget: SheetSnap | null,
): boolean {
  if (sheetTarget === null) {
    return true;
  }
  return resolvePhysicalSnap(state) === sheetTarget;
}

/**
 * Shell may emit a camera fly when the sheet is at rest at the intent target.
 * Padding-before-fly is enforced by the camera machine (`applyPadding` then `moveCamera`).
 */
export function canEmitCameraFly(state: MapShellMachineState): boolean {
  const intent = state.intent;
  if (!intent?.camera) {
    return false;
  }

  if (
    intent.camera.kind === "flyToUser" &&
    !state.environment.hasUserLocation
  ) {
    return false;
  }

  return (
    gatesOpen(state.environment) && sheetAtTarget(state, intent.sheetTarget)
  );
}

export function environmentsEqual(
  a: MapShellEnvironment,
  b: MapShellEnvironment,
): boolean {
  return (
    a.cameraSession === b.cameraSession &&
    a.sheetMotionPhase === b.sheetMotionPhase &&
    a.physicalSnap === b.physicalSnap &&
    a.mapPaddingReady === b.mapPaddingReady &&
    a.hasUserLocation === b.hasUserLocation
  );
}
