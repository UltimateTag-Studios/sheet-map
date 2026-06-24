import {
  applyShellIntent,
  emitCameraFlyIfReady,
  planItemSelectIntent,
  planSelectItemWithoutLocationIntent,
} from "../intent";
import { markRouteEntryDispatched } from "../route-enter-fly";
import type { MapShellMachineState } from "../state";
import type { MapShellMachineEvent, MapShellMachineResult } from "../types";

export function reduceSelectItem(
  state: MapShellMachineState,
  event: Extract<MapShellMachineEvent, { type: "selectItem" }>,
): MapShellMachineResult {
  if (!event.location) {
    return {
      state: {
        ...state,
        ...planSelectItemWithoutLocationIntent(event.id),
      },
      effects: [],
    };
  }

  const applied = applyShellIntent(
    state,
    planItemSelectIntent(state, event.id, event.location, {
      enterFly: event.enterFly,
      zoom: event.zoom,
    }),
  );
  const result = emitCameraFlyIfReady(applied);

  if (event.source === "route" && result.effects.length > 0) {
    return {
      ...result,
      state: markRouteEntryDispatched(result.state),
    };
  }

  return result;
}
