import type { MapEventOf } from "mapbox-gl";

type UserGestureMapEvent =
  | MapEventOf<"dragstart">
  | MapEventOf<"zoomstart">
  | MapEventOf<"wheel">;

export function isUserMapGestureEvent(event: UserGestureMapEvent): boolean {
  return (
    event != null &&
    typeof event === "object" &&
    "originalEvent" in event &&
    event.originalEvent != null
  );
}
