import { clearSelectionState } from "../helpers/selection-state";
import {
  applyShellIntent,
  emitCameraFlyIfReady,
  planUserRecenterIntent,
} from "../intent";
import { markRouteEntryDispatched } from "../route-enter-fly";
import type { MapShellMachineState } from "../state";
import type { MapShellMachineEvent, MapShellMachineResult } from "../types";

export function reduceRecenterUser(
  state: MapShellMachineState,
  event: Extract<MapShellMachineEvent, { type: "recenterUser" }>,
): MapShellMachineResult {
  const cleared = clearSelectionState(state, true);
  const applied = applyShellIntent(cleared, planUserRecenterIntent(event.zoom));
  const result = emitCameraFlyIfReady(applied);

  if (event.source === "route" && result.effects.length > 0) {
    return {
      ...result,
      state: markRouteEntryDispatched(result.state),
    };
  }

  return result;
}
