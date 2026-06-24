import type { MapItemLocation } from "../../../items/types";
import type {
  MapShellMachineState,
  ShellCameraIntent,
  ShellIntent,
} from "../state";
import { resolvePhysicalSnap } from "../state";

type ItemSelectOptions = { zoom?: number; enterFly?: boolean };

export function planItemSelect(
  state: MapShellMachineState,
  id: string,
  location: MapItemLocation,
  options?: ItemSelectOptions,
): ShellIntent {
  const physicalSnap = resolvePhysicalSnap(state);
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

  if (physicalSnap === "collapsed") {
    return {
      itemId: id,
      camera,
      sheetTarget: "collapsed",
      openHalfAfterCameraIdle: true,
    };
  }

  if (physicalSnap === "half") {
    return {
      itemId: id,
      camera,
      sheetTarget: "half",
      openHalfAfterCameraIdle: false,
    };
  }

  return {
    itemId: id,
    camera,
    sheetTarget: "half",
    openHalfAfterCameraIdle: false,
  };
}

export function planRecenterUser(zoom?: number): ShellIntent {
  return {
    itemId: null,
    camera:
      zoom !== undefined ? { kind: "flyToUser", zoom } : { kind: "flyToUser" },
    sheetTarget: null,
    openHalfAfterCameraIdle: false,
  };
}

export function armIntent(
  state: MapShellMachineState,
  intent: ShellIntent,
): MapShellMachineState {
  const next: MapShellMachineState = {
    ...state,
    intent,
    selectedItemId: intent.itemId,
  };

  if (intent.sheetTarget !== null) {
    next.sheetSnap = intent.sheetTarget;
  }

  return next;
}
