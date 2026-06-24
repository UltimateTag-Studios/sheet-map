import type { MapItemLocation } from "../../../items/types";
import type {
  MapShellMachineState,
  ShellCameraIntent,
  ShellIntent,
} from "../state";

type ItemSelectOptions = { zoom?: number; enterFly?: boolean };

export function planItemSelectIntent(
  state: MapShellMachineState,
  id: string,
  location: MapItemLocation,
  options?: ItemSelectOptions,
): ShellIntent {
  const layoutSnap = state.layoutSnap;
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

  if (layoutSnap === "collapsed") {
    return {
      phase: "awaitGates",
      itemId: id,
      camera,
      sheetTarget: "collapsed",
      openHalfAfterFly: true,
    };
  }

  if (layoutSnap === "half") {
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

export function planSelectItemWithoutLocationIntent(
  id: string,
): Pick<MapShellMachineState, "commandedSnap" | "intent" | "selectedItemId"> {
  return {
    commandedSnap: "half",
    intent: null,
    selectedItemId: id,
  };
}
