import type { Map as MapboxMap } from "mapbox-gl";

/**
 * Run callback once the map style is ready.
 * Handles cached styles, Strict Mode listener cleanup, and load events that
 * fire before the subscription is attached (via repeated idle checks).
 */
export function whenMapStyleReady(
  map: MapboxMap,
  callback: () => void,
): () => void {
  let cancelled = false;

  const run = () => {
    if (cancelled || !map.isStyleLoaded()) {
      return;
    }

    callback();
  };

  run();

  const onLoad = () => {
    run();
  };
  const onIdle = () => {
    run();
  };

  map.on("load", onLoad);
  map.on("idle", onIdle);

  return () => {
    cancelled = true;
    map.off("load", onLoad);
    map.off("idle", onIdle);
  };
}
