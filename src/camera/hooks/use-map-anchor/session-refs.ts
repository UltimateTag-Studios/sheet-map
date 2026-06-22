import type { Dispatch, MutableRefObject } from "react";

import type { MapAnchorEvent, MapAnchorState } from "../../anchor";
import type { SheetMotionPhase } from "../../viewport";

export type MapAnchorSessionRefs = {
  stateRef: MutableRefObject<MapAnchorState>;
  dispatch: Dispatch<MapAnchorEvent>;
  sheetPhaseRef: MutableRefObject<SheetMotionPhase>;
  sheetMotionActiveRef: MutableRefObject<boolean>;
};
