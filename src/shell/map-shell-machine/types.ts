import type { SheetLayoutFrameChange, SheetSnap } from "@siegetag/sheet";

import type { NavigateToMapCameraOptions } from "../../camera";
import type { MapPosition } from "../../camera/shared/map-position";
import type { MapItemLocation } from "../../items/types";
import type { SheetMotionPhase } from "../../viewport";
import type { RouteEnterFly } from "./route-enter-fly";
import type { MapShellCameraSnapshot, MapShellMachineState } from "./state";

type SheetPhase = SheetLayoutFrameChange["phase"];

/**
 * Map shell machine events — four sources:
 *
 * 1. **Intent** — user / app actions (`selectItem`, `recenterUser`, …)
 * 2. **Sheet** — `@siegetag/sheet` layout frames and settle
 * 3. **Camera** — session, padding, GPS, anchor zoom
 * 4. **Route** — active route declares enter fly (`routeEnterFlyChanged`)
 */
export type MapShellMachineEvent =
  | {
      type: "selectItem";
      id: string;
      location: MapItemLocation | null;
      enterFly?: boolean;
      zoom?: number;
      source?: "user" | "route";
    }
  | { type: "recenterUser"; zoom?: number; source?: "user" | "route" }
  | { type: "clearSelection"; dismissRouteEntry?: boolean }
  | { type: "dismissSheet" }
  | {
      type: "sheetLayoutFrameChanged";
      phase: SheetPhase;
      restingSnap: SheetSnap;
    }
  | { type: "sheetSettled"; snap: SheetSnap }
  | { type: "cameraSnapshotSynced"; snapshot: MapShellCameraSnapshot }
  | {
      type: "navigateTo";
      position: MapPosition;
      options?: NavigateToMapCameraOptions;
    }
  | {
      type: "routeEnterFlyChanged";
      routeKey: string;
      entry: RouteEnterFly | null;
    };

export type MapShellMachineEffect =
  | {
      type: "flyToItem";
      location: MapItemLocation;
      enterFly?: boolean;
      zoom?: number;
    }
  | { type: "flyToUser"; zoom?: number }
  | {
      type: "flyToPosition";
      position: MapPosition;
      duration?: number;
      preserveTracking?: boolean;
    }
  | { type: "syncCameraSheetPhase"; phase: SheetMotionPhase };

export type MapShellMachineResult = {
  state: MapShellMachineState;
  effects: MapShellMachineEffect[];
};
