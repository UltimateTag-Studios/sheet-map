import { clearSelectionState } from "./helpers/selection-state";
import {
  applyShellIntent,
  emitCameraFlyWithSync,
  planItemSelectIntent,
  planUserRecenterIntent,
} from "./intent";
import { shellNavigateGate } from "./intent/shell-navigate-gate";
import type { MapShellMachineState, RouteEntryVisit } from "./state";
import type { MapShellMachineResult } from "./types";

/** Where the map should fly when a route becomes active. */
export type RouteEnterFly =
  | { kind: "userLocation"; zoom?: number }
  | {
      kind: "item";
      id: string;
      location: import("../../items/types").MapItemLocation;
      zoom?: number;
    };

export function routeEnterFliesEqual(
  a: RouteEnterFly | null | undefined,
  b: RouteEnterFly | null | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  if (a.kind !== b.kind) {
    return false;
  }
  if (a.kind === "userLocation") {
    return a.zoom === b.zoom;
  }
  return (
    b.kind === "item" &&
    a.id === b.id &&
    a.location.lat === b.location.lat &&
    a.location.lng === b.location.lng &&
    a.zoom === b.zoom
  );
}

/** Stable dependency key for route enter-fly values (not object identity). */
export function routeEnterFlyKey(
  entry: RouteEnterFly | null | undefined,
): string {
  if (!entry) {
    return "";
  }
  if (entry.kind === "userLocation") {
    return entry.zoom !== undefined
      ? `userLocation:${entry.zoom}`
      : "userLocation";
  }
  const zoomSuffix = entry.zoom !== undefined ? `:z${entry.zoom}` : "";
  return `item:${entry.id}:${entry.location.lat},${entry.location.lng}${zoomSuffix}`;
}

function routeEntryCanTryApply(state: MapShellMachineState): boolean {
  if (!state.cameraSnapshot.mapPaddingReady) {
    return false;
  }

  if (state.sheetPhase === "settling") {
    return false;
  }

  return true;
}

function routeEntryFlyEmitted(result: MapShellMachineResult): boolean {
  return result.effects.some(
    (effect) => effect.type === "flyToItem" || effect.type === "flyToUser",
  );
}

function withRouteVisit(
  state: MapShellMachineState,
  routeVisit: RouteEntryVisit | null,
): MapShellMachineState {
  return { ...state, routeVisit };
}

export function markRouteEntryDispatched(
  state: MapShellMachineState,
): MapShellMachineState {
  if (!state.routeVisit) {
    return state;
  }

  return withRouteVisit(state, {
    ...state.routeVisit,
    applyStatus: "dispatched",
  });
}

function markRouteEntrySatisfied(
  state: MapShellMachineState,
): MapShellMachineState {
  if (!state.routeVisit) {
    return state;
  }

  return withRouteVisit(state, {
    ...state.routeVisit,
    applyStatus: "satisfied",
  });
}

/** Marks a dispatched item entry satisfied once selection matches. */
export function advanceRouteEntry(
  state: MapShellMachineState,
): MapShellMachineState {
  const visit = state.routeVisit;
  if (!visit || visit.applyStatus !== "dispatched" || !visit.entry) {
    return state;
  }

  if (visit.entry.kind === "userLocation") {
    return state;
  }

  if (state.selectedItemId === visit.entry.id) {
    return markRouteEntrySatisfied(state);
  }

  return state;
}

/** Marks user-location enter fly satisfied after the camera finishes flying. */
export function completeRouteUserEnterFly(
  state: MapShellMachineState,
  previous: MapShellMachineState["cameraSnapshot"],
  next: MapShellMachineState["cameraSnapshot"],
): MapShellMachineState {
  const visit = state.routeVisit;
  if (
    !visit ||
    visit.applyStatus !== "dispatched" ||
    visit.entry?.kind !== "userLocation"
  ) {
    return state;
  }

  if (previous.cameraSession === "flying" && next.cameraSession === "idle") {
    return markRouteEntrySatisfied(state);
  }

  return state;
}

/** Dispatches the route entry once while `applyStatus` is `waiting`. */
export function tryApplyRouteEntry(
  state: MapShellMachineState,
): MapShellMachineResult {
  const visit = state.routeVisit;
  if (!visit || visit.applyStatus !== "waiting" || !visit.entry) {
    return { state, effects: [] };
  }

  if (!routeEntryCanTryApply(state)) {
    return { state, effects: [] };
  }

  const entry = visit.entry;

  if (entry.kind === "userLocation") {
    if (!state.cameraSnapshot.hasUserLocation) {
      return { state, effects: [] };
    }

    const cleared = clearSelectionState(state, true);
    const applied = applyShellIntent(
      cleared,
      planUserRecenterIntent(cleared, entry.zoom),
    );
    const result = emitCameraFlyWithSync(applied);

    if (!routeEntryFlyEmitted(result)) {
      return { state: applied, effects: [] };
    }

    return {
      state: markRouteEntryDispatched(result.state),
      effects: result.effects,
    };
  }

  const applied = applyShellIntent(
    state,
    planItemSelectIntent(state, entry.id, entry.location, {
      enterFly: true,
      zoom: entry.zoom,
    }),
  );

  if (shellNavigateGate(applied).kind === "defer") {
    return { state: applied, effects: [] };
  }

  const result = emitCameraFlyWithSync(applied);

  if (!routeEntryFlyEmitted(result)) {
    return { state: applied, effects: [] };
  }

  return {
    state: markRouteEntryDispatched(result.state),
    effects: result.effects,
  };
}

export function resetRouteEntryToWaiting(
  state: MapShellMachineState,
): MapShellMachineState {
  const visit = state.routeVisit;
  if (!visit || visit.applyStatus === "dismissed") {
    return state;
  }

  return withRouteVisit(state, { ...visit, applyStatus: "waiting" });
}

export function dismissRouteEntry(
  state: MapShellMachineState,
): MapShellMachineState {
  const visit = state.routeVisit;
  if (!visit) {
    return state;
  }

  return withRouteVisit(state, { ...visit, applyStatus: "dismissed" });
}
