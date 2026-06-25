import type { SheetSnap } from "@siegetag/sheet";

import type { MapItemLocation } from "../../../items/types";
import type {
  MapShellMachineState,
  ShellCameraIntent,
  ShellIntent,
} from "../state";
import { snapForPlanning } from "../state";

type ItemSelectOptions = { zoom?: number; enterFly?: boolean };

function requiredSnapForSelect(
  state: MapShellMachineState,
  effectiveSnap: ReturnType<typeof snapForPlanning>,
): SheetSnap | null {
  if (effectiveSnap === "full") {
    return "half";
  }
  if (effectiveSnap === "half") {
    return state.sheetPhase === "resting" && state.sheetSnap === "half"
      ? null
      : "half";
  }
  return null;
}

export function planItemSelectIntent(
  state: MapShellMachineState,
  id: string,
  location: MapItemLocation,
  options?: ItemSelectOptions,
): ShellIntent {
  const effectiveSnap = snapForPlanning(state);
  const deferFlyUntilResting = state.sheetPhase === "settling";
  const camera: ShellCameraIntent = options?.enterFly
    ? options.zoom !== undefined
      ? {
          kind: "flyToItem",
          location,
          enterFly: true,
          zoom: options.zoom,
        }
      : { kind: "flyToItem", location, enterFly: true }
    : { kind: "flyToItem", location };

  if (effectiveSnap === "collapsed") {
    return {
      phase: "awaitGates",
      itemId: id,
      camera,
      requiredSnap: null,
      deferFlyUntilResting,
      navigateEmitted: false,
      openHalfAfterFly: true,
    };
  }

  return {
    phase: "awaitGates",
    itemId: id,
    camera,
    requiredSnap: requiredSnapForSelect(state, effectiveSnap),
    deferFlyUntilResting,
    navigateEmitted: false,
  };
}

export function planUserRecenterIntent(
  state: MapShellMachineState,
  zoom?: number,
): ShellIntent {
  return {
    phase: "awaitGates",
    itemId: null,
    camera:
      zoom !== undefined ? { kind: "flyToUser", zoom } : { kind: "flyToUser" },
    requiredSnap: null,
    deferFlyUntilResting: state.sheetPhase === "settling",
    navigateEmitted: false,
  };
}
