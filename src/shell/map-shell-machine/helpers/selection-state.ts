import { dismissRouteEntry } from "../route-enter-fly";
import type { MapShellMachineState } from "../state";

export function sheetClosedState(
  state: MapShellMachineState,
): MapShellMachineState {
  return {
    ...state,
    selectedItemId: null,
    intent: null,
    halfOpenAfterFlyPending: false,
  };
}

export function sheetDismissCommand(
  state: MapShellMachineState,
): MapShellMachineState {
  return {
    ...sheetClosedState(state),
    sheetTarget: "collapsed",
  };
}

export function clearSelectionState(
  state: MapShellMachineState,
  shouldDismissRouteEntry: boolean,
): MapShellMachineState {
  return {
    ...state,
    sheetTarget: null,
    selectedItemId: null,
    intent: null,
    routeVisit:
      shouldDismissRouteEntry && state.routeVisit
        ? dismissRouteEntry(state).routeVisit
        : state.routeVisit,
  };
}

export function routeEntryInterruptedOnCollapse(
  state: MapShellMachineState,
): boolean {
  const visit = state.routeVisit;
  if (!visit?.entry || visit.entry.kind !== "item") {
    return false;
  }

  if (visit.applyStatus === "waiting") {
    return state.selectedItemId !== visit.entry.id;
  }

  return (
    visit.applyStatus === "dispatched" &&
    state.selectedItemId !== visit.entry.id
  );
}
