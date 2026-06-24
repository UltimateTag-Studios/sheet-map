import { describe, expect, it } from "vitest";

import { reduceMapShellMachine } from "./reduce";
import {
  createInitialMapShellMachineState,
  type MapShellCameraSnapshot,
  type MapShellMachineState,
} from "./state";

const defaultSnapshot = createInitialMapShellMachineState().cameraSnapshot;

function snapshot(
  overrides: Partial<MapShellCameraSnapshot> = {},
): MapShellCameraSnapshot {
  return { ...defaultSnapshot, ...overrides };
}

function baseState(
  overrides: Partial<MapShellMachineState> = {},
): MapShellMachineState {
  const base = createInitialMapShellMachineState();
  const merged: MapShellMachineState = { ...base, ...overrides };
  if (
    overrides.commandedSnap !== undefined &&
    overrides.layoutSnap === undefined
  ) {
    merged.layoutSnap = overrides.commandedSnap;
  }
  if (overrides.cameraSnapshot) {
    merged.cameraSnapshot = snapshot(overrides.cameraSnapshot);
  }
  return merged;
}

const readySnapshot = snapshot({
  mapPaddingReady: true,
  hasUserLocation: true,
});

describe("reduceMapShellMachine", () => {
  it("selectItem from collapsed emits fly with awaitCameraIdleForHalf intent", () => {
    const state = baseState({ cameraSnapshot: readySnapshot });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
    });

    expect(result.state.selectedItemId).toBe("a");
    expect(result.state.commandedSnap).toBe("collapsed");
    expect(result.state.intent).toEqual({
      phase: "awaitCameraIdleForHalf",
      itemId: "a",
    });
    expect(result.effects).toEqual([
      { type: "flyToItem", location: { lat: 1, lng: 2 } },
    ]);
  });

  it("opens half after camera flying to idle for collapsed fly-first select", () => {
    const state = baseState({
      cameraSnapshot: snapshot({ ...readySnapshot, cameraSession: "flying" }),
      intent: {
        phase: "awaitCameraIdleForHalf",
        itemId: "a",
      },
    });

    const result = reduceMapShellMachine(state, {
      type: "cameraSnapshotSynced",
      snapshot: snapshot({ ...readySnapshot, cameraSession: "idle" }),
    });

    expect(result.state.commandedSnap).toBe("half");
    expect(result.state.intent).toBeNull();
  });

  it("selectItem at half flies immediately", () => {
    const state = baseState({
      commandedSnap: "half",
      layoutSnap: "half",
      cameraSnapshot: readySnapshot,
    });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
    });

    expect(result.state.commandedSnap).toBe("half");
    expect(result.effects).toEqual([
      { type: "flyToItem", location: { lat: 1, lng: 2 } },
    ]);
  });

  it("selectItem at full commands half and defers fly until layout half", () => {
    const state = baseState({
      commandedSnap: "full",
      layoutSnap: "full",
      cameraSnapshot: readySnapshot,
    });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
    });

    expect(result.state.commandedSnap).toBe("half");
    expect(result.state.intent?.phase).toBe("awaitGates");
    if (result.state.intent?.phase === "awaitGates") {
      expect(result.state.intent.camera).toEqual({
        kind: "flyToItem",
        location: { lat: 1, lng: 2 },
      });
    }
    expect(result.effects).toEqual([]);
  });

  it("full reselect B while A selected at layout full slides to half then flies", () => {
    const state = baseState({
      commandedSnap: "half",
      layoutSnap: "full",
      selectedItemId: "a",
      cameraSnapshot: readySnapshot,
    });

    const select = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "b",
      location: { lat: 3, lng: 4 },
    });

    expect(select.state.commandedSnap).toBe("half");
    expect(select.effects).toEqual([]);

    const afterHalf = reduceMapShellMachine(select.state, {
      type: "sheetSettled",
      snap: "half",
    });

    expect(afterHalf.effects).toEqual([
      { type: "flyToItem", location: { lat: 3, lng: 4 } },
    ]);
  });

  it("defers fly while sheet is dragging", () => {
    const state = baseState({
      sheetMotionPhase: "dragging",
      layoutSnap: "half",
      cameraSnapshot: readySnapshot,
    });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
    });

    expect(result.effects).toEqual([]);
    expect(result.state.intent?.phase).toBe("awaitGates");
  });

  it("defers fly when layoutSnap has not reached intent sheetTarget", () => {
    const state = baseState({
      commandedSnap: "half",
      layoutSnap: "full",
      cameraSnapshot: readySnapshot,
    });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
    });

    expect(result.effects).toEqual([]);
  });

  it("recenterUser at full flies without changing sheet snap", () => {
    const state = baseState({
      commandedSnap: "full",
      layoutSnap: "full",
      selectedItemId: "a",
      cameraSnapshot: readySnapshot,
    });

    const result = reduceMapShellMachine(state, {
      type: "recenterUser",
    });

    expect(result.state.selectedItemId).toBeNull();
    expect(result.state.commandedSnap).toBe("full");
    expect(result.effects).toEqual([{ type: "flyToUser", zoom: 14 }]);
  });

  it("recenterUser during drag defers fly", () => {
    const state = baseState({
      commandedSnap: "full",
      layoutSnap: "full",
      sheetMotionPhase: "dragging",
      cameraSnapshot: readySnapshot,
    });

    const result = reduceMapShellMachine(state, { type: "recenterUser" });

    expect(result.effects).toEqual([]);
    if (result.state.intent?.phase === "awaitGates") {
      expect(result.state.intent.camera).toEqual({ kind: "flyToUser" });
    }
    expect(result.state.commandedSnap).toBe("full");
  });

  it("latest intent wins when selecting during an in-flight camera move", () => {
    const state = baseState({
      cameraSnapshot: snapshot({ ...readySnapshot, cameraSession: "flying" }),
      intent: {
        phase: "awaitCameraIdleForHalf",
        itemId: "a",
      },
    });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "b",
      location: { lat: 9, lng: 8 },
    });

    expect(result.state.selectedItemId).toBe("b");
    expect(result.effects).toEqual([
      { type: "flyToItem", location: { lat: 9, lng: 8 } },
    ]);
  });

  it("dismissSheet collapses and clears intent", () => {
    const state = baseState({
      selectedItemId: "a",
      intent: {
        phase: "awaitGates",
        itemId: "a",
        camera: { kind: "flyToItem", location: { lat: 1, lng: 2 } },
        sheetTarget: "half",
      },
    });

    const result = reduceMapShellMachine(state, { type: "dismissSheet" });

    expect(result.state.commandedSnap).toBe("collapsed");
    expect(result.state.selectedItemId).toBeNull();
    expect(result.state.intent).toBeNull();
  });

  it("clearSelection dismisses route entry apply status", () => {
    const state = baseState({
      routeVisit: {
        routeKey: "inventory",
        entry: {
          kind: "item",
          id: "a",
          location: { lat: 1, lng: 2 },
        },
        applyStatus: "dispatched",
      },
    });

    const result = reduceMapShellMachine(state, {
      type: "clearSelection",
      dismissRouteEntry: true,
    });

    expect(result.state.routeVisit?.applyStatus).toBe("dismissed");
  });

  it("selectItem without location opens half via planner", () => {
    const state = baseState();

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: null,
    });

    expect(result.state.commandedSnap).toBe("half");
    expect(result.state.selectedItemId).toBe("a");
    expect(result.state.intent).toBeNull();
    expect(result.effects).toEqual([]);
  });

  it("navigateTo emits flyToPosition and clears selection by default", () => {
    const state = baseState({ selectedItemId: "a" });
    const position = { lat: 1, lng: 2, zoom: 12 };

    const result = reduceMapShellMachine(state, {
      type: "navigateTo",
      position,
    });

    expect(result.state.selectedItemId).toBeNull();
    expect(result.effects).toEqual([
      { type: "flyToPosition", position, preserveTracking: undefined },
    ]);
  });

  it("navigateTo with preserveTracking keeps selection", () => {
    const state = baseState({ selectedItemId: "a" });
    const position = { lat: 1, lng: 2, zoom: 12 };

    const result = reduceMapShellMachine(state, {
      type: "navigateTo",
      position,
      options: { preserveTracking: true },
    });

    expect(result.state.selectedItemId).toBe("a");
    expect(result.effects[0]).toEqual({
      type: "flyToPosition",
      position,
      preserveTracking: true,
    });
  });

  it("sheetLayoutFrameChanged emits syncCameraSheetPhase when phase changes", () => {
    const state = baseState({ sheetMotionPhase: "idle" });

    const result = reduceMapShellMachine(state, {
      type: "sheetLayoutFrameChanged",
      phase: "dragging",
      restingSnap: "half",
    });

    expect(result.state.layoutSnap).toBe("half");
    expect(result.state.sheetMotionPhase).toBe("dragging");
    expect(result.effects).toEqual([
      { type: "syncCameraSheetPhase", phase: "dragging" },
    ]);
  });
});
