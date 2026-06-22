import { applyMapAnchorCamera, stopMapMotion } from "../anchor";
import { canNavigateMap } from "../shared/can-navigate-map";
import { mergeMapAnchorPosition } from "../shared/map-position";
import type { MoveCameraProgrammaticInput } from "./types";

/**
 * App-initiated camera move: stop momentum (optional), pre-hook, then fly or jump.
 * Session FSM (`flyStarted` / settle) is owned by the caller (`navigateTo`).
 */
export function moveCameraProgrammatic({
  mapRef,
  position,
  duration = 0,
  stopUserMotion = true,
  onBeforeCamera,
  currentAnchor = null,
  updateAnchor,
}: MoveCameraProgrammaticInput): boolean {
  if (!canNavigateMap(mapRef)) {
    return false;
  }

  const map = mapRef.getMap();

  if (stopUserMotion) {
    stopMapMotion(map);
  }

  onBeforeCamera?.(map);

  const anchorPosition = mergeMapAnchorPosition(currentAnchor, position);
  updateAnchor?.(anchorPosition);

  applyMapAnchorCamera(mapRef, position, { duration });
  return true;
}
