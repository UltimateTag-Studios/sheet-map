import type { Map as MapboxMap } from "mapbox-gl";

import type { PixelPoint } from "../../viewport/types/pixel";
import type { MapPosition } from "../shared/map-position";
import { readUserLocationFollowDistancePx } from "../shared/user-location-follow-distance";
import { readMapAnchorPosition } from "./read-position";

export type MapAnchorFollowConfig = {
  userLocation: { lat: number; lng: number };
  centerOffset: PixelPoint;
  /** Screen pixels — supplied by app/hook (e.g. demo default 40). */
  thresholdPx: number;
};

export type GestureSettleOutcome =
  | { kind: "snapBackToUser"; target: MapPosition }
  | { kind: "releaseTracking" }
  | { kind: "commitAnchor"; position: MapPosition };

export function evaluateFollowAtGestureSettle(
  map: MapboxMap,
  follow: MapAnchorFollowConfig | null | undefined,
  thresholdExceeded: boolean,
): GestureSettleOutcome {
  const position = readMapAnchorPosition(map);

  if (!follow) {
    return { kind: "commitAnchor", position };
  }

  if (thresholdExceeded) {
    return { kind: "releaseTracking" };
  }

  const distancePx = readUserLocationFollowDistancePx(
    map,
    follow.centerOffset,
    follow.userLocation,
  );

  if (distancePx > follow.thresholdPx) {
    return { kind: "releaseTracking" };
  }

  return {
    kind: "snapBackToUser",
    target: {
      lat: follow.userLocation.lat,
      lng: follow.userLocation.lng,
    },
  };
}
