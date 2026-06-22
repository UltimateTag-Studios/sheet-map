import { useEffect, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import type { SheetMotionPhase } from "../../../viewport";
import { trySettleNavigatingSession } from "../../anchor";
import type { MapAnchorSessionRefs } from "./session-refs";

export type UseMapAnchorSheetSettleInput = {
  mapRef: MapRef | null;
  enabled: boolean;
  sheetPhase: SheetMotionPhase;
  session: MapAnchorSessionRefs;
};

export function useMapAnchorSheetSettle({
  mapRef,
  enabled,
  sheetPhase,
  session,
}: UseMapAnchorSheetSettleInput): void {
  const { stateRef, dispatch, sheetMotionActiveRef } = session;
  const sheetMotionActive = sheetPhase !== "idle";
  const prevSheetMotionActiveRef = useRef(sheetMotionActive);

  useEffect(() => {
    const wasSheetMotionActive = prevSheetMotionActiveRef.current;
    prevSheetMotionActiveRef.current = sheetMotionActive;

    if (!mapRef || !enabled || sheetMotionActive || !wasSheetMotionActive) {
      return;
    }

    trySettleNavigatingSession(
      mapRef.getMap(),
      stateRef,
      sheetMotionActiveRef,
      dispatch,
    );
  }, [
    sheetMotionActive,
    mapRef,
    enabled,
    stateRef,
    dispatch,
    sheetMotionActiveRef,
  ]);
}
