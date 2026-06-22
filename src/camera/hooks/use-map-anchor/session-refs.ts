import type { Dispatch, MutableRefObject } from "react";

import type { SheetMotionPhase } from "../../viewport";
import type { MapAnchorEvent, MapAnchorState } from "../anchor";

export type MapAnchorSessionRefs = {
  stateRef: MutableRefObject<MapAnchorState>;
  dispatch: Dispatch<MapAnchorEvent>;
  sheetPhaseRef: MutableRefObject<SheetMotionPhase>;
  sheetMotionActiveRef: MutableRefObject<boolean>;
};
