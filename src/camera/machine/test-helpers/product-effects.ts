import type { MapCameraMachineEffect } from "../types";

/** Product effects only — excludes synchronous shell bridge notifications. */
export function productEffects(
  effects: MapCameraMachineEffect[],
): MapCameraMachineEffect[] {
  return effects.filter((effect) => effect.type !== "notifyShell");
}
