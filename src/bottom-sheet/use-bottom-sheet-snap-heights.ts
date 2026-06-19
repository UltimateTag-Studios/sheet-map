import { useEffect, useState } from "react";

import { normalizeHalfSnapFraction } from "../shell/normalize-half-snap-fraction";
import { measureCollapsedHeightPx, readFullHeightPx } from "./snap-heights";

export type UseBottomSheetSnapHeightsOptions = {
  handleEl: HTMLElement | null;
  peekEl: HTMLElement | null;
  collapsedBottomInsetPx?: number;
  halfSnapFraction?: number;
};

export type BottomSheetSnapHeights = {
  collapsedHeightPx: number;
  fullHeightPx: number;
};

function heightsEqual(
  a: BottomSheetSnapHeights,
  b: BottomSheetSnapHeights,
): boolean {
  return (
    a.collapsedHeightPx === b.collapsedHeightPx &&
    a.fullHeightPx === b.fullHeightPx
  );
}

export function useBottomSheetSnapHeights({
  handleEl,
  peekEl,
  collapsedBottomInsetPx = 0,
  halfSnapFraction,
}: UseBottomSheetSnapHeightsOptions): BottomSheetSnapHeights {
  const resolvedHalfSnap = normalizeHalfSnapFraction(halfSnapFraction);

  const [heights, setHeights] = useState<BottomSheetSnapHeights>(() => {
    const fullHeightPx = readFullHeightPx();
    return {
      collapsedHeightPx: measureCollapsedHeightPx(
        handleEl,
        peekEl,
        collapsedBottomInsetPx,
        fullHeightPx,
        resolvedHalfSnap,
      ),
      fullHeightPx,
    };
  });

  useEffect(() => {
    const syncHeights = () => {
      const fullHeightPx = readFullHeightPx();
      const next = {
        collapsedHeightPx: measureCollapsedHeightPx(
          handleEl,
          peekEl,
          collapsedBottomInsetPx,
          fullHeightPx,
          resolvedHalfSnap,
        ),
        fullHeightPx,
      };
      setHeights((current) => (heightsEqual(current, next) ? current : next));
    };

    syncHeights();

    const observers: ResizeObserver[] = [];
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(syncHeights);
      if (handleEl) {
        observer.observe(handleEl);
      }
      if (peekEl) {
        observer.observe(peekEl);
      }
      observers.push(observer);
    }

    window.addEventListener("resize", syncHeights);
    window.visualViewport?.addEventListener("resize", syncHeights);

    return () => {
      for (const observer of observers) {
        observer.disconnect();
      }
      window.removeEventListener("resize", syncHeights);
      window.visualViewport?.removeEventListener("resize", syncHeights);
    };
  }, [handleEl, peekEl, collapsedBottomInsetPx, resolvedHalfSnap]);

  return heights;
}
