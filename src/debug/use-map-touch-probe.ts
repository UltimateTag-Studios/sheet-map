import { useEffect } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import {
  classifyTouchTarget,
  describeTouchTarget,
} from "./describe-touch-target";

export type MapTouchProbeEvent = "pointerdown" | "pointerup" | "click";

export type MapTouchProbePayload = {
  event: MapTouchProbeEvent;
  pointerId: number | null;
  clientX: number;
  clientY: number;
  defaultPrevented: boolean;
  sheetPhase: string | null;
  target: string | null;
  hitTarget: string | null;
  targetMismatch: boolean;
  inSheet: boolean;
  inOverlaySlot: boolean;
  inMapCanvas: boolean;
  isMapControl: boolean;
  mapMoving: boolean | null;
};

function readSheetPhase(): string | null {
  return (
    document.querySelector(".sheet")?.getAttribute("data-sheet-phase") ?? null
  );
}

function readMapMoving(mapRef: MapRef | null): boolean | null {
  if (!mapRef) {
    return null;
  }

  try {
    return mapRef.getMap().isMoving();
  } catch {
    return null;
  }
}

function buildPayload(
  event: MapTouchProbeEvent,
  nativeEvent: PointerEvent | MouseEvent,
  mapRef: MapRef | null,
): MapTouchProbePayload {
  const clientX = nativeEvent.clientX;
  const clientY = nativeEvent.clientY;
  const hitNode = document.elementFromPoint(clientX, clientY);
  const hit = classifyTouchTarget(hitNode);

  return {
    event,
    pointerId:
      nativeEvent instanceof PointerEvent ? nativeEvent.pointerId : null,
    clientX,
    clientY,
    defaultPrevented: nativeEvent.defaultPrevented,
    sheetPhase: readSheetPhase(),
    target: describeTouchTarget(nativeEvent.target),
    hitTarget: describeTouchTarget(hitNode),
    targetMismatch:
      nativeEvent.target instanceof Node &&
      hitNode instanceof Node &&
      nativeEvent.target !== hitNode,
    inSheet: hit.inSheet,
    inOverlaySlot: hit.inOverlaySlot,
    inMapCanvas: hit.inMapCanvas,
    isMapControl: hit.isMapControl,
    mapMoving: readMapMoving(mapRef),
  };
}

/** Document capture probe for map/sheet touch diagnosis — enable with `config.debug`. */
export function useMapTouchProbe(
  enabled: boolean,
  mapRef: MapRef | null,
): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const log = (
      event: MapTouchProbeEvent,
      nativeEvent: PointerEvent | MouseEvent,
    ) => {
      console.info(
        "[map-touch-probe]",
        buildPayload(event, nativeEvent, mapRef),
      );
    };

    const onPointerDown = (nativeEvent: PointerEvent) => {
      log("pointerdown", nativeEvent);
    };

    const onPointerUp = (nativeEvent: PointerEvent) => {
      log("pointerup", nativeEvent);
    };

    const onClick = (nativeEvent: MouseEvent) => {
      log("click", nativeEvent);
    };

    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    document.addEventListener("pointerup", onPointerUp, { capture: true });
    document.addEventListener("click", onClick, { capture: true });

    console.info(
      "[map-touch-probe] enabled — drag the sheet open, then tap a map control; compare 1st vs 2nd attempt",
    );

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
      document.removeEventListener("pointerup", onPointerUp, { capture: true });
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, [enabled, mapRef]);
}
