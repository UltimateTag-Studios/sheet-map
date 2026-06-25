import { applyCameraSnapshot } from "./camera-snapshot/apply";
import { mergeResults } from "./helpers/merge-results";
import {
  clearSelectionState,
  sheetDismissCommand,
} from "./helpers/selection-state";
import { reduceRecenterUser } from "./recenter/reduce";
import { reduceRouteEnterFlyChanged } from "./route/reduce-enter-fly-changed";
import {
  advanceRouteEntry,
  dismissRouteEntry,
  tryApplyRouteEntry,
} from "./route-enter-fly";
import { reduceSelectItem } from "./select/reduce";
import {
  reduceSheetLayoutFrameChanged,
  reduceSheetSettled,
  reduceSheetSnapChangeStarted,
} from "./sheet/reduce";
import type { MapShellMachineState } from "./state";
import type { MapShellMachineEvent, MapShellMachineResult } from "./types";

/** Unified map-shell intent FSM: selection, sheet snap, route entry, camera fly. */
export function reduceMapShellMachine(
  state: MapShellMachineState,
  event: MapShellMachineEvent,
): MapShellMachineResult {
  switch (event.type) {
    case "cameraSnapshotSynced": {
      const snapshotResult = applyCameraSnapshot(state, event.snapshot);
      const advanced = advanceRouteEntry(snapshotResult.state);
      return mergeResults(snapshotResult, tryApplyRouteEntry(advanced));
    }

    case "routeEnterFlyChanged": {
      return reduceRouteEnterFlyChanged(state, event.routeKey, event.entry);
    }

    case "sheetLayoutFrameChanged": {
      return reduceSheetLayoutFrameChanged(
        state,
        event.phase,
        event.restingSnap,
      );
    }

    case "sheetSettled": {
      return reduceSheetSettled(state, event.snap);
    }

    case "sheetSnapChangeStarted": {
      return reduceSheetSnapChangeStarted(state, event.snap);
    }

    case "selectItem": {
      return reduceSelectItem(state, event);
    }

    case "recenterUser": {
      return reduceRecenterUser(state, event);
    }

    case "navigateTo": {
      const nextState = event.options?.preserveTracking
        ? state
        : clearSelectionState(state, true);

      return {
        state: nextState,
        effects: [
          {
            type: "flyToPosition",
            position: event.position,
            duration: event.options?.duration,
            preserveTracking: event.options?.preserveTracking,
          },
        ],
      };
    }

    case "clearSelection": {
      if (state.selectedItemId === null && state.intent === null) {
        if (event.dismissRouteEntry !== false && state.routeVisit) {
          return {
            state: dismissRouteEntry(state),
            effects: [],
          };
        }
        return { state, effects: [] };
      }

      return {
        state: clearSelectionState(state, event.dismissRouteEntry !== false),
        effects: [],
      };
    }

    case "dismissSheet": {
      if (
        state.selectedItemId === null &&
        state.intent === null &&
        (state.sheetTarget === "collapsed" ||
          (state.sheetTarget === null && state.sheetSnap === "collapsed"))
      ) {
        return { state, effects: [] };
      }

      return {
        state: sheetDismissCommand(state),
        effects: [],
      };
    }

    default: {
      return { state, effects: [] };
    }
  }
}
