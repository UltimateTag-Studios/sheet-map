import type { MapItemLocation } from "../../items/types";

/**
 * Camera + sheet sequencing after selecting a map item from a collapsed sheet.
 *
 * fly-then-open: flyingToItem → (camera session idle) → sheet opens to half
 */
export type ItemSelectCamera =
  | { status: "idle" }
  | { status: "flyingToItem"; location: MapItemLocation };

export function idleItemSelectCamera(): ItemSelectCamera {
  return { status: "idle" };
}

export function isFlyingToItem(
  camera: ItemSelectCamera,
): camera is { status: "flyingToItem"; location: MapItemLocation } {
  return camera.status === "flyingToItem";
}
