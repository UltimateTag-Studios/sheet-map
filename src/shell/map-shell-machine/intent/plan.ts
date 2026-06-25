import type { MapItemLocation } from "../../../items/types";
import type {
  MapShellMachineState,
  ShellCameraIntent,
  ShellIntent,
} from "../state";
import { snapForPlanning } from "../state";

type ItemSelectOptions = { zoom?: number; enterFly?: boolean };

export function planItemSelectIntent(
  state: MapShellMachineState,
  id: string,
  location: MapItemLocation,
  options?: ItemSelectOptions,
): ShellIntent {
  const effectiveSnap = snapForPlanning(state);
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
      sheetTarget: "collapsed",
      openHalfAfterFly: true,
    };
  }

  if (effectiveSnap === "half") {
    return {
      phase: "awaitGates",
      itemId: id,
      camera,
      sheetTarget: "half",
    };
  }

  return {
    phase: "awaitGates",
    itemId: id,
    camera,
    sheetTarget: "half",
  };
}

export function planUserRecenterIntent(zoom?: number): ShellIntent {
  return {
    phase: "awaitGates",
    itemId: null,
    camera:
      zoom !== undefined ? { kind: "flyToUser", zoom } : { kind: "flyToUser" },
    sheetTarget: null,
  };
}
