import type { SheetLayoutFrameChange } from "@siegetag/sheet";
import { useCallback, useEffect, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import { attachViewportObservers } from "../sync/attach-viewport-observers";
import { readLiveSheetObscuredBottomPx } from "./read-live-sheet-obscured-bottom-px";
import { readSheetHost } from "./read-sheet-host";

export type UseLiveSheetObscuredBottomPxResult = {
  sheetObscuredBottomPx: number;
  onSheetLayoutFrameChange: (frame: SheetLayoutFrameChange) => void;
};

/** Live distance from map canvas bottom to sheet top (pixels). */
export function useLiveSheetObscuredBottomPx(
  mapRef: MapRef | null,
): UseLiveSheetObscuredBottomPxResult {
  const [sheetObscuredBottomPx, setSheetObscuredBottomPx] = useState(0);

  const syncFromDom = useCallback(() => {
    if (!mapRef) {
      return;
    }

    const canvas = mapRef.getMap().getCanvas();
    const next = readLiveSheetObscuredBottomPx(canvas) ?? 0;
    setSheetObscuredBottomPx((current) => (current === next ? current : next));
  }, [mapRef]);

  const onSheetLayoutFrameChange = useCallback(
    (_frame: SheetLayoutFrameChange) => {
      syncFromDom();
    },
    [syncFromDom],
  );

  useEffect(() => {
    if (!mapRef) {
      setSheetObscuredBottomPx(0);
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
    onSheetLayoutFrameChange,
  };
}
