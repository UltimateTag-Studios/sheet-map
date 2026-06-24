import type { SheetLayoutFrameChange } from "@siegetag/sheet";
import { useCallback, useEffect, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import { attachViewportObservers } from "../sync/attach-viewport-observers";
import { readLiveSheetObscuredBottomPx } from "./read-live-sheet-obscured-bottom-px";
import { readSheetHost } from "./read-sheet-host";

export type SheetMotionPhase = SheetLayoutFrameChange["phase"];

export type UseLiveSheetObscuredBottomPxResult = {
  sheetObscuredBottomPx: number;
  /** Sheet gesture machine phase — idle once drag and settle animation finish. */
  sheetPhase: SheetMotionPhase;
  onSheetLayoutFrameChange: (frame: SheetLayoutFrameChange) => void;
};

/** Live distance from map canvas bottom to sheet top (pixels). */
export function useLiveSheetObscuredBottomPx(
  mapRef: MapRef | null,
): UseLiveSheetObscuredBottomPxResult {
  const [sheetObscuredBottomPx, setSheetObscuredBottomPx] = useState(0);
  const [sheetPhase, setSheetPhase] = useState<SheetMotionPhase>("idle");

  const syncFromDom = useCallback(() => {
    if (!mapRef) {
      return;
    }

    const canvas = mapRef.getMap().getCanvas();
    const next = readLiveSheetObscuredBottomPx(canvas);
    setSheetObscuredBottomPx(next ?? 0);
  }, [mapRef]);

  const onSheetLayoutFrameChange = useCallback(
    (frame: SheetLayoutFrameChange) => {
      setSheetPhase(frame.phase);
      syncFromDom();
    },
    [syncFromDom],
  );

  useEffect(() => {
    if (!mapRef) {
      setSheetObscuredBottomPx(0);
      setSheetPhase("idle");
      return;
    }

    const map = mapRef.getMap();
    const canvas = map.getCanvas();

    syncFromDom();

    const cleanupObservers = attachViewportObservers(
      canvas,
      readSheetHost(canvas),
      syncFromDom,
    );
    map.on("resize", syncFromDom);

    return () => {
      cleanupObservers();
      map.off("resize", syncFromDom);
    };
  }, [mapRef, syncFromDom]);

  return {
    sheetObscuredBottomPx,
    sheetPhase,
    onSheetLayoutFrameChange,
  };
}
