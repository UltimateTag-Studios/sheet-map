import type { SheetSnap } from "@siegetag/sheet";
import { useEffect, useRef } from "react";

import type { PixelRect } from "../canvas/viewport/map-viewport";

const PROBE_TAG = "[map-touch-probe]";

type ElementSummary = {
  tag: string;
  className: string;
  ariaLabel: string | null;
};

function describeElement(element: Element | null): ElementSummary | null {
  if (!element) {
    return null;
  }

  return {
    tag: element.tagName,
    className: typeof element.className === "string" ? element.className : "",
    ariaLabel: element.getAttribute("aria-label"),
  };
}

function rectSummary(element: Element | null) {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  return {
    top: Math.round(rect.top),
    left: Math.round(rect.left),
    bottom: Math.round(rect.bottom),
    right: Math.round(rect.right),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

function pointInRect(
  x: number,
  y: number,
  rect: DOMRect | null | undefined,
): boolean {
  if (!rect) {
    return false;
  }

  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function readProbeGeometry(viewportClientRect: PixelRect | null) {
  const button = document.querySelector(".sheet-map-my-location-button");
  const overlay = document.querySelector(".sheet-map-visible-area-overlay");
  const sheetSlide = document.querySelector(".sheet-slide");
  const buttonRect = button?.getBoundingClientRect() ?? null;

  return {
    viewportClientRect,
    buttonInDom: button !== null,
    overlayInDom: overlay !== null,
    buttonRect: rectSummary(button),
    overlayRect: rectSummary(overlay),
    sheetSlideRect: rectSummary(sheetSlide),
    sheetPhase: document
      .querySelector(".sheet")
      ?.getAttribute("data-sheet-phase"),
    buttonCoversPoint: (x: number, y: number) => pointInRect(x, y, buttonRect),
  };
}

export type UseMapTouchProbeOptions = {
  enabled: boolean;
  sheetSnap: SheetSnap;
  isDraggingSheet: boolean;
  viewportClientRect: PixelRect | null;
};

/** Capture-phase touch logging for map chrome hit-testing (debug only). */
export function useMapTouchProbe({
  enabled,
  sheetSnap,
  isDraggingSheet,
  viewportClientRect,
}: UseMapTouchProbeOptions): void {
  const sheetSnapRef = useRef(sheetSnap);
  const isDraggingRef = useRef(isDraggingSheet);
  const viewportRef = useRef(viewportClientRect);
  const wasDraggingRef = useRef(isDraggingSheet);

  sheetSnapRef.current = sheetSnap;
  isDraggingRef.current = isDraggingSheet;
  viewportRef.current = viewportClientRect;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    console.info(
      PROBE_TAG,
      "enabled — tap the location button after sheet drags",
    );

    const logGeometry = (label: string, extra?: Record<string, unknown>) => {
      console.info(PROBE_TAG, label, {
        sheetSnap: sheetSnapRef.current,
        isDraggingSheet: isDraggingRef.current,
        ...readProbeGeometry(viewportRef.current),
        ...extra,
      });
    };

    const inLocationButtonZone = (clientX: number, clientY: number) => {
      const geometry = readProbeGeometry(viewportRef.current);
      if (geometry.buttonCoversPoint(clientX, clientY)) {
        return true;
      }

      const overlay = document.querySelector(".sheet-map-visible-area-overlay");
      if (overlay instanceof HTMLElement) {
        const rect = overlay.getBoundingClientRect();
        return (
          clientX >= rect.left &&
          clientX <= rect.left + 96 &&
          clientY >= rect.bottom - 96 &&
          clientY <= rect.bottom + 8
        );
      }

      return clientX <= 120 && clientY >= window.innerHeight * 0.45;
    };

    const shouldLogPointer = (clientX: number, clientY: number) => {
      return inLocationButtonZone(clientX, clientY);
    };

    const logPointer = (
      phase: "pointerdown" | "pointerup" | "click",
      event: PointerEvent | MouseEvent,
    ) => {
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      const path = event
        .composedPath()
        .slice(0, 10)
        .map((node) =>
          node instanceof Element ? describeElement(node) : null,
        );

      console.info(PROBE_TAG, phase, {
        pointerType: "pointerType" in event ? event.pointerType : "mouse",
        pointerId: "pointerId" in event ? event.pointerId : null,
        clientX: Math.round(event.clientX),
        clientY: Math.round(event.clientY),
        defaultPrevented: event.defaultPrevented,
        sheetSnap: sheetSnapRef.current,
        isDraggingSheet: isDraggingRef.current,
        target: describeElement(
          event.target instanceof Element ? event.target : null,
        ),
        hit: describeElement(hit),
        hitIsLocationButton:
          hit?.closest(".sheet-map-my-location-button") !== null,
        hitIsSheet: hit?.closest(".sheet-slide") !== null,
        path,
        ...readProbeGeometry(viewportRef.current),
      });
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      if (!shouldLogPointer(event.clientX, event.clientY)) {
        return;
      }
      logPointer("pointerdown", event);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      if (!shouldLogPointer(event.clientX, event.clientY)) {
        return;
      }
      logPointer("pointerup", event);
    };

    const onClick = (event: MouseEvent) => {
      if (!shouldLogPointer(event.clientX, event.clientY)) {
        return;
      }
      logPointer("click", event);
    };

    const onLocationPress = () => {
      console.info(PROBE_TAG, "location-button onPress fired");
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("click", onClick, true);
    window.addEventListener("map-touch-probe-location-press", onLocationPress);

    logGeometry("probe-attached");

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(
        "map-touch-probe-location-press",
        onLocationPress,
      );
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      wasDraggingRef.current = isDraggingSheet;
      return;
    }

    if (wasDraggingRef.current && !isDraggingSheet) {
      console.info(PROBE_TAG, "sheet drag ended", {
        sheetSnap: sheetSnapRef.current,
        ...readProbeGeometry(viewportRef.current),
      });
    }

    wasDraggingRef.current = isDraggingSheet;
  }, [enabled, isDraggingSheet]);
}

/** Debug-only: call from the location button handler to confirm onPress ran. */
export function notifyMapTouchProbeLocationPress(): void {
  window.dispatchEvent(new Event("map-touch-probe-location-press"));
}
