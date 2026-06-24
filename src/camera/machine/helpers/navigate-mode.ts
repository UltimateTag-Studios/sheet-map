import type { MapPosition } from "../../shared/map-position";
import { isSheetMotionIdle, type MapCameraState } from "../state";
import type { MapCameraMachineEffect } from "../types";

export function resolveNavigateMode(
  state: MapCameraState,
  requested: "fly" | "jump",
): "fly" | "jump" {
  if (!isSheetMotionIdle(state.sheetPhase)) {
    return "jump";
  }

  return requested;
}

export function buildNavigateEffects(
  state: MapCameraState,
  position: MapPosition,
  mode: "fly" | "jump",
  durationMs: number,
): MapCameraMachineEffect[] {
  const effects: MapCameraMachineEffect[] = [];

  if (state.padding.options) {
    effects.push({
      type: "applyPadding",
      options: state.padding.options,
      realign: false,
    });
  }

  effects.push({
    type: "moveCamera",
    position,
    duration: mode === "fly" ? durationMs : 0,
  });

  return effects;
}
