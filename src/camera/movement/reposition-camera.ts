import { jumpToMapAnchor } from "../anchor";
import { canNavigateMap } from "../shared/can-navigate-map";
import { mergeMapAnchorPosition } from "../shared/map-position";
import type { RepositionCameraInput } from "./types";

/**
 * Instant jump only — no `map.stop()`, no navigating session.
 * GPS ticks and padding realign; not `navigateTo` (which claims the session).
 */
export function repositionCamera({
  mapRef,
  position,
  currentAnchor,
  updateAnchor,
}: RepositionCameraInput): boolean {
  if (!canNavigateMap(mapRef)) {
    return false;
  }

  const anchorPosition = mergeMapAnchorPosition(currentAnchor, position);
  updateAnchor?.(anchorPosition);
  jumpToMapAnchor(mapRef, position);
  return true;
}
