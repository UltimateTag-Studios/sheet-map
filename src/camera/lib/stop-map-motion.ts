import type { Map as MapboxMap } from "mapbox-gl";

/** Halt inertial pan/zoom and in-flight animations before programmatic camera moves. */
export function stopMapMotion(map: MapboxMap): void {
  if (typeof map.stop === "function") {
    map.stop();
  }
}
