import type { MapShellMachineState } from "./map-shell-machine/state";
import { resolveEnterFlyZoom } from "./resolve-enter-fly-zoom";

export function resolveEnterFlyZoomFromState(
  state: MapShellMachineState,
  explicitZoom?: number,
): number | undefined {
  const { anchorZoom, defaultEnterFlyZoom } = state.cameraSnapshot;
  return resolveEnterFlyZoom({
    explicitZoom,
    anchorZoom: anchorZoom ?? undefined,
    defaultZoom: defaultEnterFlyZoom,
  });
}
