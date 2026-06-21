import { useEffect, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import type { MapObscuredInsets } from "../viewport";
import {
  areMapPaddingOptionsEqual,
  computeMapPadding,
  type MapPaddingOptions,
} from "./compute-map-padding";

export type UseMapPaddingSyncOptions = {
  mapRef: MapRef | null;
  sheetObscuredBottomPx: number;
  fixedChromeInsets?: Partial<MapObscuredInsets>;
  enabled?: boolean;
  debug?: boolean;
};

/** Live Mapbox padding sync from sheet geometry — no anchor side effects. */
export function useMapPaddingSync({
  mapRef,
  sheetObscuredBottomPx,
  fixedChromeInsets,
  enabled = true,
  debug = false,
}: UseMapPaddingSyncOptions): MapPaddingOptions | null {
  const [appliedPadding, setAppliedPadding] =
    useState<MapPaddingOptions | null>(null);

  useEffect(() => {
    if (!enabled || !mapRef) {
      setAppliedPadding(null);
      return;
    }

    const map = mapRef.getMap();
    let cancelled = false;

    const nextPadding = computeMapPadding({
      sheetObscuredBottomPx,
      fixedChromeInsets,
    });

    const applyPadding = () => {
      if (cancelled || !map.isStyleLoaded()) {
        return;
      }

      const currentPadding = map.getPadding();
      const current: MapPaddingOptions = {
        top: currentPadding.top,
        left: currentPadding.left,
        right: currentPadding.right,
        bottom: currentPadding.bottom,
      };

      if (!areMapPaddingOptionsEqual(current, nextPadding)) {
        if (debug) {
          console.info("[map-padding-sync] setPadding", nextPadding);
        }

        map.setPadding(nextPadding);
      }

      setAppliedPadding(nextPadding);
    };

    applyPadding();
    map.on("load", applyPadding);
    map.on("idle", applyPadding);
    map.on("styledata", applyPadding);

    return () => {
      cancelled = true;
      map.off("load", applyPadding);
      map.off("idle", applyPadding);
      map.off("styledata", applyPadding);
    };
  }, [mapRef, sheetObscuredBottomPx, fixedChromeInsets, enabled, debug]);

  return appliedPadding;
}
