import { reduceMapCameraNavigate } from "../navigate/reduce";
import type { MapCameraState } from "../state";
import type { MapCameraMachineResult } from "../types";

export function tryIssueBootFly(
  state: MapCameraState,
): MapCameraMachineResult | null {
  if (
    !state.enabled ||
    state.boot !== "pending" ||
    state.bootTarget === null ||
    state.padding.phase !== "ready"
  ) {
    return null;
  }

  const navigate = reduceMapCameraNavigate(state, {
    type: "navigateRequested",
    position: state.bootTarget,
    mode: "fly",
    preserveTracking: true,
    durationMs: state.bootFlyDurationMs,
  });

  return {
    state: {
      ...navigate.state,
      boot: "done",
      tracking: "on",
      follow: state.bootFollow,
      lastAppliedGpsKey: state.bootPositionKey,
      bootFollow: null,
      bootPositionKey: null,
    },
    effects: navigate.effects,
  };
}
