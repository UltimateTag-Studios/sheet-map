import type { MapShellMachineState } from "../state";

export type ShellNavigateGate =
  | { kind: "emit" }
  | {
      kind: "defer";
      reason: "settling" | "requiredSnap" | "padding" | "noUserLocation";
    }
  | { kind: "none" };

/** Pure gate for shell navigate emit — see docs/truth-tables.md fly emit gates. */
export function shellNavigateGate(
  state: MapShellMachineState,
): ShellNavigateGate {
  const intent = state.intent;
  if (!intent || intent.phase !== "awaitGates") {
    return { kind: "none" };
  }

  if (intent.navigateEmitted) {
    return { kind: "none" };
  }

  if (!state.cameraSnapshot.mapPaddingReady) {
    return { kind: "defer", reason: "padding" };
  }

  if (
    intent.camera.kind === "flyToUser" &&
    !state.cameraSnapshot.hasUserLocation
  ) {
    return { kind: "defer", reason: "noUserLocation" };
  }

  if (state.sheetPhase === "dragging") {
    return { kind: "emit" };
  }

  if (state.sheetPhase === "settling" || intent.deferFlyUntilResting) {
    return { kind: "defer", reason: "settling" };
  }

  if (state.sheetPhase === "resting") {
    if (
      intent.requiredSnap != null &&
      state.sheetSnap !== intent.requiredSnap
    ) {
      return { kind: "defer", reason: "requiredSnap" };
    }
    return { kind: "emit" };
  }

  return { kind: "none" };
}

export function shellNavigateGateAllowsEmit(
  state: MapShellMachineState,
): boolean {
  return shellNavigateGate(state).kind === "emit";
}
