import { SHEET_AXIS_THRESHOLD_PX } from "@siegetag/sheet";
import type { GeoJSONFeature } from "mapbox-gl";
import type { PointerEventHandler, RefObject } from "react";
import { useCallback, useRef } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import {
  type MapFeaturePressHandlers,
  resolveMapFeaturePress,
} from "./resolve-map-feature-press";

type MapFeaturePointerGesture = {
  pointerId: number;
  clientX: number;
  clientY: number;
  clickHandled: boolean;
};

function pointerMovedBeyondTap(
  startX: number,
  startY: number,
  clientX: number,
  clientY: number,
): boolean {
  return (
    Math.hypot(clientX - startX, clientY - startY) > SHEET_AXIS_THRESHOLD_PX
  );
}

function queryInteractiveFeaturesAtClientPoint(
  mapRef: MapRef,
  clientX: number,
  clientY: number,
  layerIds: readonly string[],
): GeoJSONFeature[] {
  if (layerIds.length === 0) {
    return [];
  }

  const map = mapRef.getMap();
  const container = map.getContainer();
  const rect = container.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  return map.queryRenderedFeatures([x, y], { layers: [...layerIds] });
}

/**
 * GeoJSON / Mapbox hit targets are picked from the map, not DOM `click`.
 * When touch WebViews skip `click` after a sheet drag, complete the tap on
 * `pointerup` with `queryRenderedFeatures` unless Mapbox `click` already ran.
 */
export function useMapFeaturePointerPress(
  mapRefHolder: RefObject<MapRef | null>,
  interactiveLayerIds: readonly string[],
  handlers: MapFeaturePressHandlers,
): {
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  notifyMapClickHandled: () => void;
} {
  const gestureRef = useRef<MapFeaturePointerGesture | null>(null);
  const handlersRef = useRef(handlers);
  const interactiveLayerIdsRef = useRef(interactiveLayerIds);

  handlersRef.current = handlers;
  interactiveLayerIdsRef.current = interactiveLayerIds;

  const notifyMapClickHandled = useCallback(() => {
    const gesture = gestureRef.current;
    if (gesture) {
      gesture.clickHandled = true;
    }
  }, []);

  const tryPressFeaturesAtPoint = useCallback(
    (clientX: number, clientY: number) => {
      const mapRef = mapRefHolder.current;
      const layerIds = interactiveLayerIdsRef.current;
      if (!mapRef || layerIds.length === 0) {
        return;
      }

      const features = queryInteractiveFeaturesAtClientPoint(
        mapRef,
        clientX,
        clientY,
        layerIds,
      );
      resolveMapFeaturePress(features, handlersRef.current);
    },
    [mapRefHolder],
  );

  const onPointerDown = useCallback<PointerEventHandler<HTMLDivElement>>(
    (event) => {
      if (event.button !== 0) {
        return;
      }

      gestureRef.current = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        clickHandled: false,
      };
    },
    [],
  );

  const onPointerUp = useCallback<PointerEventHandler<HTMLDivElement>>(
    (event) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) {
        return;
      }

      if (
        pointerMovedBeyondTap(
          gesture.clientX,
          gesture.clientY,
          event.clientX,
          event.clientY,
        )
      ) {
        gestureRef.current = null;
        return;
      }

      const clientX = event.clientX;
      const clientY = event.clientY;
      const pointerId = event.pointerId;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const current = gestureRef.current;
          if (!current || current.pointerId !== pointerId) {
            return;
          }

          if (!current.clickHandled) {
            tryPressFeaturesAtPoint(clientX, clientY);
          }

          gestureRef.current = null;
        });
      });
    },
    [tryPressFeaturesAtPoint],
  );

  return {
    onPointerDown,
    onPointerUp,
    notifyMapClickHandled,
  };
}
