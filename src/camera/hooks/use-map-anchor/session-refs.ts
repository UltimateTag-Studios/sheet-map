import type { Dispatch, RefObject } from "react";

import type { SheetMotionPhase } from "../../../viewport";
import type { MapAnchorEvent, MapAnchorState } from "../../anchor";

export type MapAnchorSessionRefs = {
  stateRef: RefObject<MapAnchorState>;
  dispatch: Dispatch<MapAnchorEvent>;
  sheetPhaseRef: RefObject<SheetMotionPhase>;
  sheetMotionActiveRef: RefObject<boolean>;
};
