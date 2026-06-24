import type { RouteEnterFly } from "../route-enter-fly";
import { routeEnterFliesEqual, tryApplyRouteEntry } from "../route-enter-fly";
import type { MapShellMachineState } from "../state";
import type { MapShellMachineResult } from "../types";

export function reduceRouteEnterFlyChanged(
  state: MapShellMachineState,
  routeKey: string,
  entry: RouteEnterFly | null,
): MapShellMachineResult {
  if (!routeKey) {
    return {
      state: {
        ...state,
        routeVisit: null,
        selectedItemId: null,
        intent: null,
      },
      effects: [],
    };
  }

  const sameRoute = state.routeVisit?.routeKey === routeKey;
  const sameEntry = routeEnterFliesEqual(state.routeVisit?.entry, entry);

  if (sameRoute && sameEntry) {
    return { state, effects: [] };
  }

  const nextState: MapShellMachineState = {
    ...state,
    selectedItemId: sameRoute ? state.selectedItemId : null,
    intent: sameRoute ? state.intent : null,
    routeVisit: {
      routeKey,
      entry,
      applyStatus: "waiting",
    },
  };

  if (!entry) {
    return { state: nextState, effects: [] };
  }

  return tryApplyRouteEntry(nextState);
}
