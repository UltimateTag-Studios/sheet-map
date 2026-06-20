import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Drawer } from "vaul";

import { normalizeHalfSnapFraction } from "../shell/normalize-half-snap-fraction";
import { PeekMeasureProvider } from "./peek-measure-context";
import { nearestSnapPoint } from "./sheet-body-snap-pan";
import { SheetDragContextProvider } from "./sheet-drag-context";
import {
  bottomSheetSnapPointPx,
  readVisibleDrawerHeightPx,
} from "./snap-heights";
import { useBottomSheetSnapHeights } from "./use-bottom-sheet-snap-heights";

const FULL_HEIGHT_EPSILON_PX = 2;

export type BottomSheetSnap = "collapsed" | "half" | "full";

export { DEFAULT_HALF_SNAP_FRACTION } from "../shell/normalize-half-snap-fraction";

export type BottomSheetProps = {
  children: ReactNode;
  snap?: BottomSheetSnap;
  defaultSnap?: BottomSheetSnap;
  onSnapChange?: (snap: BottomSheetSnap) => void;
  /** Fires when the user starts or stops dragging (e.g. defer map camera updates). */
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
  const drawerContentRef = useRef<HTMLDivElement | null>(null);
  const [handleEl, setHandleEl] = useState<HTMLElement | null>(null);
  const [peekEl, setPeekEl] = useState<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canBodyScrollLive, setCanBodyScrollLive] = useState(false);

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
    if (snap !== undefined && !isDragging) {
      setActiveSnapPoint(
        snapPointForSnap(snap, collapsedSnap, fullSnap, resolvedHalfSnap),
      );
    }
  }, [snap, collapsedSnap, fullSnap, resolvedHalfSnap, isDragging]);

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

  const syncLiveDrawerHeight = useCallback(() => {
    const el = drawerContentRef.current;
    if (!el) {
      return;
    }
    const height = readVisibleDrawerHeightPx(el);
    setCanBodyScrollLive(height >= fullHeightPx - FULL_HEIGHT_EPSILON_PX);
  }, [fullHeightPx]);

  useEffect(() => {
    if (!isDragging) {
      setCanBodyScrollLive(false);
      return;
    }

    let frameId = 0;
    const tick = () => {
      syncLiveDrawerHeight();
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isDragging, syncLiveDrawerHeight]);

  const getVisibleDrawerHeightPx = useCallback(() => {
    const el = drawerContentRef.current;
    if (!el) {
      return collapsedHeightPx;
    }
    return readVisibleDrawerHeightPx(el);
  }, [collapsedHeightPx]);

  const applySnapPoint = useCallback(
    (point: number | string) => {
      setActiveSnapPoint(point);
      onSnapChange?.(snapFromSnapPoint(point, snapPoints));
    },
    [onSnapChange, snapPoints],
  );

  const applySnapHeightPx = useCallback((heightPx: number) => {
    setActiveSnapPoint(bottomSheetSnapPointPx(heightPx));
  }, []);

  const snapToNearestAfterPan = useCallback(() => {
    const heightPx = getVisibleDrawerHeightPx();
    applySnapPoint(nearestSnapPoint(heightPx, snapPoints, fullHeightPx));
  }, [applySnapPoint, fullHeightPx, getVisibleDrawerHeightPx, snapPoints]);

  const beginBodyGesture = useCallback(() => {
    setIsDragging(true);
    onDragInteractionChange?.(true);
    syncLiveDrawerHeight();
  }, [onDragInteractionChange, syncLiveDrawerHeight]);

  const endBodyGesture = useCallback(() => {
    setIsDragging(false);
    onDragInteractionChange?.(false);
  }, [onDragInteractionChange]);

  const handleDrag = useCallback(() => {
    beginBodyGesture();
  }, [beginBodyGesture]);

  const handleRelease = useCallback(() => {
    snapToNearestAfterPan();
    endBodyGesture();
  }, [endBodyGesture, snapToNearestAfterPan]);

  const sheetDragContextValue = useMemo(
    () => ({
      canBodyScrollLive,
      isDragging,
      collapsedHeightPx,
      fullHeightPx,
      snapPoints,
      getVisibleDrawerHeightPx,
      applySnapHeightPx,
      beginBodyGesture,
      endBodyGesture,
      snapToNearestAfterPan,
    }),
    [
      applySnapHeightPx,
      beginBodyGesture,
      canBodyScrollLive,
      collapsedHeightPx,
      endBodyGesture,
      fullHeightPx,
      getVisibleDrawerHeightPx,
      isDragging,
      snapPoints,
      snapToNearestAfterPan,
    ],
  );

  return (
    <Drawer.Root
      open
      modal={false}
      dismissible={false}
      fadeFromIndex={0}
      /** Avoid 500ms drag lock after inner scroll — pairs with `useVaulScrollHandoff`. */
      scrollLockTimeout={0}
      snapPoints={snapPoints}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={(point) => {
        applySnapPoint(point ?? collapsedSnap);
      }}
      onDrag={handleDrag}
      onRelease={handleRelease}
    >
      <Drawer.Content
        ref={drawerContentRef}
        className="sheet-map-drawer fixed inset-x-0 bottom-0 flex h-[100dvh] flex-col outline-none"
        style={{ bottom: "0px", ...drawerStyle }}
        aria-describedby={undefined}
      >
        <Drawer.Handle
          ref={setHandleEl}
          className="sheet-map-drawer-handle mx-auto shrink-0"
          style={drawerHandleStyle}
        />
        <SheetDragContextProvider value={sheetDragContextValue}>
          <PeekMeasureProvider onPeekMeasure={setPeekEl}>
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </PeekMeasureProvider>
        </SheetDragContextProvider>
      </Drawer.Content>
    </Drawer.Root>
  );
}
