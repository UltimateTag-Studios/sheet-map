import { useCallback, useEffect, useRef } from "react";

import { useSheetBodyPanContext } from "./sheet-drag-context";
import { bottomSheetSnapPointPx } from "./snap-heights";

const SCROLL_TOP_EPSILON_PX = 1;
const PAN_DIRECTION_THRESHOLD_PX = 8;

/** Map vertical pan delta to a clamped drawer height in px. */
export function snapHeightFromPanDelta(args: {
  startHeightPx: number;
  startClientY: number;
  currentClientY: number;
  minHeightPx: number;
  maxHeightPx: number;
}): number {
  const deltaY = args.startClientY - args.currentClientY;
  return Math.min(
    args.maxHeightPx,
    Math.max(args.minHeightPx, args.startHeightPx + deltaY),
  );
}

export function resolveSnapPointHeightPx(
  point: number | string,
  fullHeightPx: number,
): number {
  if (typeof point === "number") {
    return Math.round(fullHeightPx * point);
  }
  if (point.endsWith("px")) {
    return Number.parseInt(point, 10);
  }
  return fullHeightPx;
}

export function nearestSnapPoint(
  heightPx: number,
  snapPoints: Array<number | string>,
  fullHeightPx: number,
): number | string {
  let nearest = snapPoints[0] ?? bottomSheetSnapPointPx(fullHeightPx);
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const point of snapPoints) {
    const pointPx = resolveSnapPointHeightPx(point, fullHeightPx);
    const distance = Math.abs(heightPx - pointPx);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = point;
    }
  }

  return nearest;
}

/** Body drives sheet height when not scrollable, or at scroll top (collapse / expand). */
export function shouldBodyPanSheet(args: {
  canBodyScroll: boolean;
  scrollTopPx: number;
}): boolean {
  if (!args.canBodyScroll) {
    return true;
  }
  return args.scrollTopPx <= SCROLL_TOP_EPSILON_PX;
}

type PanState = {
  pointerId: number;
  startClientY: number;
  startHeightPx: number;
  /** At full + scroll top, wait for downward move before resizing the sheet. */
  pendingDirection: boolean;
  active: boolean;
};

export type SheetBodySnapPan = {
  bodyRootRef: (node: HTMLDivElement | null) => void;
};

/**
 * Drives live px snap height from body pointer pans.
 * Below full height: always pans. At full + scroll top: pans down to collapse;
 * upward move hands off to content scroll.
 */
export function useSheetBodySnapPan(canBodyScroll: boolean): SheetBodySnapPan {
  const {
    collapsedHeightPx,
    fullHeightPx,
    getVisibleDrawerHeightPx,
    applySnapHeightPx,
    beginBodyGesture,
    endBodyGesture,
    snapToNearestAfterPan,
  } = useSheetBodyPanContext();

  const canBodyScrollRef = useRef(canBodyScroll);
  const scrollTopRef = useRef(0);
  const panStateRef = useRef<PanState | null>(null);
  const bodyElRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  canBodyScrollRef.current = canBodyScroll;

  const readScrollTop = useCallback((el: HTMLDivElement) => {
    scrollTopRef.current = el.scrollTop;
  }, []);

  const canPanSheet = useCallback(() => {
    return shouldBodyPanSheet({
      canBodyScroll: canBodyScrollRef.current,
      scrollTopPx: scrollTopRef.current,
    });
  }, []);

  const clearPan = useCallback(
    (el: HTMLDivElement | null, pointerId: number) => {
      if (el?.hasPointerCapture(pointerId)) {
        el.releasePointerCapture(pointerId);
      }
      panStateRef.current = null;
    },
    [],
  );

  const releasePan = useCallback(
    (snapOnRelease: boolean) => {
      const state = panStateRef.current;
      const el = bodyElRef.current;
      if (!state) {
        return;
      }

      clearPan(el, state.pointerId);

      if (snapOnRelease) {
        snapToNearestAfterPan();
        endBodyGesture();
      }
    },
    [clearPan, endBodyGesture, snapToNearestAfterPan],
  );

  useEffect(() => {
    const state = panStateRef.current;
    if (!canBodyScroll || !state?.active) {
      return;
    }
    if (state.startHeightPx >= fullHeightPx - SCROLL_TOP_EPSILON_PX) {
      return;
    }
    releasePan(false);
  }, [canBodyScroll, fullHeightPx, releasePan]);

  const attachPan = useCallback(
    (el: HTMLDivElement) => {
      const commitPanDown = (state: PanState, event: PointerEvent) => {
        state.pendingDirection = false;
        state.active = true;
        beginBodyGesture();
        event.preventDefault();
        event.stopPropagation();
        applySnapHeightPx(
          snapHeightFromPanDelta({
            startHeightPx: state.startHeightPx,
            startClientY: state.startClientY,
            currentClientY: event.clientY,
            minHeightPx: collapsedHeightPx,
            maxHeightPx: fullHeightPx,
          }),
        );
      };

      const onScroll = () => {
        readScrollTop(el);
      };

      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0) {
          return;
        }

        readScrollTop(el);
        if (!canPanSheet()) {
          return;
        }

        event.stopPropagation();
        el.setPointerCapture(event.pointerId);

        const pendingDirection = canBodyScrollRef.current;
        panStateRef.current = {
          pointerId: event.pointerId,
          startClientY: event.clientY,
          startHeightPx: getVisibleDrawerHeightPx(),
          pendingDirection,
          active: !pendingDirection,
        };

        if (!pendingDirection) {
          beginBodyGesture();
        }
      };

      const onPointerMove = (event: PointerEvent) => {
        const state = panStateRef.current;
        if (!state || event.pointerId !== state.pointerId) {
          return;
        }

        readScrollTop(el);

        if (state.pendingDirection) {
          const deltaY = event.clientY - state.startClientY;
          if (Math.abs(deltaY) < PAN_DIRECTION_THRESHOLD_PX) {
            return;
          }
          if (deltaY < 0) {
            clearPan(el, state.pointerId);
            return;
          }
          commitPanDown(state, event);
          return;
        }

        if (!state.active || !canPanSheet()) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        applySnapHeightPx(
          snapHeightFromPanDelta({
            startHeightPx: state.startHeightPx,
            startClientY: state.startClientY,
            currentClientY: event.clientY,
            minHeightPx: collapsedHeightPx,
            maxHeightPx: fullHeightPx,
          }),
        );
      };

      const onPointerEnd = (event: PointerEvent) => {
        const state = panStateRef.current;
        if (!state || event.pointerId !== state.pointerId) {
          return;
        }
        if (state.active) {
          releasePan(true);
          return;
        }
        clearPan(el, state.pointerId);
      };

      readScrollTop(el);
      el.addEventListener("scroll", onScroll, { passive: true });
      el.addEventListener("pointerdown", onPointerDown, { capture: true });
      el.addEventListener("pointermove", onPointerMove);
      el.addEventListener("pointerup", onPointerEnd);
      el.addEventListener("pointercancel", onPointerEnd);

      return () => {
        el.removeEventListener("scroll", onScroll);
        el.removeEventListener("pointerdown", onPointerDown, { capture: true });
        el.removeEventListener("pointermove", onPointerMove);
        el.removeEventListener("pointerup", onPointerEnd);
        el.removeEventListener("pointercancel", onPointerEnd);
      };
    },
    [
      applySnapHeightPx,
      beginBodyGesture,
      canPanSheet,
      clearPan,
      collapsedHeightPx,
      fullHeightPx,
      getVisibleDrawerHeightPx,
      readScrollTop,
      releasePan,
    ],
  );

  const bodyRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      bodyElRef.current = node;
      if (node) {
        cleanupRef.current = attachPan(node);
      }
    },
    [attachPan],
  );

  useEffect(() => () => cleanupRef.current?.(), []);

  return { bodyRootRef };
}
