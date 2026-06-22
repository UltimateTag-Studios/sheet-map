import type { MapEventOf } from "mapbox-gl";

export function isUserMapGestureEvent(
  event: MapEventOf<"dragstart"> | MapEventOf<"zoomstart">,
): boolean {
  return (
    event != null &&
    typeof event === "object" &&
    "originalEvent" in event &&
    event.originalEvent != null
  );
}
