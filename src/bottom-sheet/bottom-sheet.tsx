import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Drawer } from "vaul";

import { normalizeHalfSnapFraction } from "../shell/normalize-half-snap-fraction";
import { PeekMeasureProvider } from "./peek-measure-context";
import { bottomSheetSnapPointPx } from "./snap-heights";
import { useBottomSheetSnapHeights } from "./use-bottom-sheet-snap-heights";

export type BottomSheetSnap = "collapsed" | "half" | "full";

export { DEFAULT_HALF_SNAP_FRACTION } from "../shell/normalize-half-snap-fraction";

export type BottomSheetProps = {
  children: ReactNode;
  snap?: BottomSheetSnap;
  defaultSnap?: BottomSheetSnap;
  onSnapChange?: (snap: BottomSheetSnap) => void;
  /** Fires when the user starts or stops dragging (for collapsed peek overlays). */
  onDragInteractionChange?: (isDragging: boolean) => void;
  /** Extra pixels below measured peek for collapsed snap (e.g. floating tab bar). */
  collapsedBottomInsetPx?: number;
  /** Vaul fraction snap between collapsed and full (default 0.5). */
  halfSnapFraction?: number;
  /** Merged layout vars + optional drawer visual overrides. */
  drawerStyle?: CSSProperties;
  /** Optional handle visual overrides. */
  drawerHandleStyle?: CSSProperties;
  /** Called when measured collapsed/full snap heights change. */
  onSnapHeightsChange?: (heights: {
    collapsedHeightPx: number;
    fullHeightPx: number;
  }) => void;
};

function snapFromSnapPoint(
  point: number | string | null,
  snapPoints: (number | string)[],
): BottomSheetSnap {
  if (point === snapPoints[0]) {
    return "collapsed";
  }
  if (point === snapPoints[1]) {
    return "half";
  }
  return "full";
}

function snapPointForSnap(
  snap: BottomSheetSnap,
  collapsedSnap: string,
  fullSnap: string,
  halfSnapFraction: number,
): number | string {
  if (snap === "collapsed") {
    return collapsedSnap;
  }
  if (snap === "full") {
    return fullSnap;
  }
  return halfSnapFraction;
}

export function BottomSheet({
  children,
  snap,
  defaultSnap = "half",
  onSnapChange,
  onDragInteractionChange,
  collapsedBottomInsetPx = 0,
  halfSnapFraction,
  drawerStyle,
  drawerHandleStyle,
  onSnapHeightsChange,
}: BottomSheetProps) {
  const resolvedHalfSnap = normalizeHalfSnapFraction(halfSnapFraction);
  const [handleEl, setHandleEl] = useState<HTMLElement | null>(null);
  const [peekEl, setPeekEl] = useState<HTMLElement | null>(null);

  const { collapsedHeightPx, fullHeightPx } = useBottomSheetSnapHeights({
    handleEl,
    peekEl,
    collapsedBottomInsetPx,
    halfSnapFraction: resolvedHalfSnap,
  });

  useEffect(() => {
    onSnapHeightsChange?.({ collapsedHeightPx, fullHeightPx });
  }, [collapsedHeightPx, fullHeightPx, onSnapHeightsChange]);

  const collapsedSnap = useMemo(
    () => bottomSheetSnapPointPx(collapsedHeightPx),
    [collapsedHeightPx],
  );

  const fullSnap = useMemo(
    () => bottomSheetSnapPointPx(fullHeightPx),
    [fullHeightPx],
  );

  const snapPoints = useMemo(
    () => [collapsedSnap, resolvedHalfSnap, fullSnap],
    [collapsedSnap, resolvedHalfSnap, fullSnap],
  );

  const [activeSnapPoint, setActiveSnapPoint] = useState<
    number | string | null
  >(() =>
    snapPointForSnap(defaultSnap, collapsedSnap, fullSnap, resolvedHalfSnap),
  );

  useEffect(() => {
    if (snap !== undefined) {
      setActiveSnapPoint(
        snapPointForSnap(snap, collapsedSnap, fullSnap, resolvedHalfSnap),
      );
    }
  }, [snap, collapsedSnap, fullSnap, resolvedHalfSnap]);

  useEffect(() => {
    if (snap !== undefined) {
      return;
    }

    const activeSnap = snapFromSnapPoint(activeSnapPoint, snapPoints);
    if (activeSnap === "collapsed" && activeSnapPoint !== collapsedSnap) {
      setActiveSnapPoint(collapsedSnap);
    }
    if (activeSnap === "full" && activeSnapPoint !== fullSnap) {
      setActiveSnapPoint(fullSnap);
    }
  }, [snap, activeSnapPoint, collapsedSnap, fullSnap, snapPoints]);

  return (
    <Drawer.Root
      open
      modal={false}
      dismissible={false}
      fadeFromIndex={0}
      snapPoints={snapPoints}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={(point) => {
        if (snap === undefined) {
          setActiveSnapPoint(point);
        }
        onSnapChange?.(snapFromSnapPoint(point, snapPoints));
      }}
      onDrag={() => {
        onDragInteractionChange?.(true);
      }}
      onRelease={() => {
        onDragInteractionChange?.(false);
      }}
    >
      <Drawer.Content
        className="sheet-map-drawer fixed inset-x-0 bottom-0 flex h-[100dvh] flex-col outline-none"
        style={{ bottom: "0px", ...drawerStyle }}
        aria-describedby={undefined}
      >
        <Drawer.Handle
          ref={setHandleEl}
          className="sheet-map-drawer-handle mx-auto shrink-0"
          style={drawerHandleStyle}
        />
        <PeekMeasureProvider onPeekMeasure={setPeekEl}>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </PeekMeasureProvider>
      </Drawer.Content>
    </Drawer.Root>
  );
}
