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
  if (overrides.cameraSnapshot) {
    merged.cameraSnapshot = snapshot(overrides.cameraSnapshot);
  }
  return merged;
}

const readySnapshot = snapshot({
  mapPaddingReady: true,
  hasUserLocation: true,
});

const flySync = {
  type: "syncCameraSheetPhase" as const,
  phase: "idle" as const,
};

/**
 * Truth-table rows from camera.md — every row gets an explicit reducer sequence.
 */
describe("map shell truth table", () => {
  it("item at collapsed: fly then open half after camera idle", () => {
    const select = reduceMapShellMachine(
      baseState({ cameraSnapshot: readySnapshot }),
      {
        type: "selectItem",
        id: "a",
        location: { lat: 1, lng: 2 },
      },
    );

    expect(select.effects).toEqual([
      flySync,
      { type: "flyToItem", location: { lat: 1, lng: 2 } },
    ]);
    expect(select.state.halfOpenAfterFlyPending).toBe(true);

    const afterFly = reduceMapShellMachine(select.state, {
      type: "cameraSnapshotSynced",
      snapshot: snapshot({ ...readySnapshot, cameraSession: "flying" }),
    });

    expect(afterFly.state.sheetTarget).toBe("collapsed");

    const afterIdle = reduceMapShellMachine(afterFly.state, {
      type: "cameraSnapshotSynced",
      snapshot: readySnapshot,
    });

    expect(afterIdle.state.sheetTarget).toBe("half");
    expect(afterIdle.state.intent).toBeNull();
    expect(afterIdle.state.halfOpenAfterFlyPending).toBe(false);
  });

  it("item at collapsed: jump fly opens half on idle snapshot (padding-late retry)", () => {
    const notReady = snapshot({
      mapPaddingReady: false,
      hasUserLocation: true,
    });
    const select = reduceMapShellMachine(
      baseState({ cameraSnapshot: notReady }),
      {
        type: "selectItem",
        id: "a",
        location: { lat: 1, lng: 2 },
      },
    );

    expect(select.effects).toEqual([]);

    const paddingReady = reduceMapShellMachine(select.state, {
      type: "cameraSnapshotSynced",
      snapshot: readySnapshot,
    });

    expect(paddingReady.effects).toEqual([
      flySync,
      { type: "flyToItem", location: { lat: 1, lng: 2 } },
    ]);
    expect(paddingReady.state.halfOpenAfterFlyPending).toBe(true);

    const afterJump = reduceMapShellMachine(paddingReady.state, {
      type: "cameraSnapshotSynced",
      snapshot: readySnapshot,
    });

    expect(afterJump.state.sheetTarget).toBe("half");
  });

  it("item at half: fly immediately", () => {
    const result = reduceMapShellMachine(
      baseState({ sheetSnap: "half", cameraSnapshot: readySnapshot }),
      { type: "selectItem", id: "a", location: { lat: 1, lng: 2 } },
    );

    expect(result.effects).toEqual([
      flySync,
      { type: "flyToItem", location: { lat: 1, lng: 2 } },
    ]);
  });

  it("item at full: fly after sheetSnap reaches half on layout idle", () => {
    const select = reduceMapShellMachine(
      baseState({
        sheetSnap: "full",
        selectedItemId: "a",
        cameraSnapshot: readySnapshot,
      }),
      { type: "selectItem", id: "b", location: { lat: 3, lng: 4 } },
    );

    expect(select.effects).toEqual([]);

    const settling = reduceMapShellMachine(select.state, {
      type: "sheetLayoutFrameChanged",
      phase: "settling",
      restingSnap: "half",
    });

    const settled = reduceMapShellMachine(settling.state, {
      type: "sheetSettled",
      snap: "half",
    });

    expect(settled.effects).toEqual([]);
    expect(settled.state.sheetSnap).toBe("half");

    const idle = reduceMapShellMachine(settled.state, {
      type: "sheetLayoutFrameChanged",
      phase: "idle",
      restingSnap: "half",
    });

    expect(idle.effects).toEqual([
      flySync,
      { type: "flyToItem", location: { lat: 3, lng: 4 } },
    ]);
  });

  it("item at full: layout idle commits missed half arrival and flies", () => {
    const select = reduceMapShellMachine(
      baseState({
        sheetSnap: "full",
        selectedItemId: "a",
        cameraSnapshot: readySnapshot,
      }),
      { type: "selectItem", id: "b", location: { lat: 3, lng: 4 } },
    );

    const layout = reduceMapShellMachine(select.state, {
      type: "sheetLayoutFrameChanged",
      phase: "idle",
      restingSnap: "half",
    });

    expect(layout.state.sheetSnap).toBe("half");
    expect(layout.effects).toEqual([
      flySync,
      { type: "flyToItem", location: { lat: 3, lng: 4 } },
    ]);
  });

  it("stale half-target intent cancelled on snap-close start — no fly on collapse", () => {
    const stuck = baseState({
      sheetSnap: "half",
      selectedItemId: "b",
      cameraSnapshot: readySnapshot,
      intent: {
        phase: "awaitGates",
        itemId: "b",
        camera: { kind: "flyToItem", location: { lat: 3, lng: 4 } },
        sheetTarget: "half",
      },
    });

    const closeStarted = reduceMapShellMachine(stuck, {
      type: "sheetSnapChangeStarted",
      snap: "collapsed",
    });

    expect(closeStarted.state.selectedItemId).toBeNull();
    expect(closeStarted.state.intent).toBeNull();
    expect(closeStarted.effects).toEqual([]);

    const collapsed = reduceMapShellMachine(closeStarted.state, {
      type: "sheetSettled",
      snap: "collapsed",
    });

    expect(collapsed.effects).toEqual([]);
  });

  it("stale half-target intent cancelled on drag-close — no fly on collapse", () => {
    const stuck = baseState({
      sheetSnap: "half",
      selectedItemId: "b",
      cameraSnapshot: readySnapshot,
      intent: {
        phase: "awaitGates",
        itemId: "b",
        camera: { kind: "flyToItem", location: { lat: 3, lng: 4 } },
        sheetTarget: "half",
      },
    });

    const dragClose = reduceMapShellMachine(stuck, {
      type: "sheetLayoutFrameChanged",
      phase: "dragging",
      restingSnap: "collapsed",
    });

    expect(dragClose.state.selectedItemId).toBeNull();
    expect(dragClose.state.intent).toBeNull();
    expect(dragClose.effects).toEqual([
      { type: "syncCameraSheetPhase", phase: "dragging" },
    ]);

    const restingAtHalf = reduceMapShellMachine(dragClose.state, {
      type: "sheetLayoutFrameChanged",
      phase: "idle",
      restingSnap: "half",
    });

    expect(restingAtHalf.effects).not.toContainEqual(
      expect.objectContaining({ type: "flyToItem" }),
    );

    const collapsed = reduceMapShellMachine(restingAtHalf.state, {
      type: "sheetSettled",
      snap: "collapsed",
    });

    expect(collapsed.state.selectedItemId).toBeNull();
    expect(collapsed.effects).toEqual([]);
  });

  it("select-during-dismiss preserved on collapsed settle", () => {
    const state = baseState({
      sheetSnap: "half",
      sheetTarget: "collapsed",
      sheetPhase: "settling",
      selectedItemId: "b",
      cameraSnapshot: readySnapshot,
      intent: {
        phase: "awaitGates",
        itemId: "b",
        camera: { kind: "flyToItem", location: { lat: 3, lng: 4 } },
        sheetTarget: "collapsed",
        openHalfAfterFly: true,
      },
    });

    const settled = reduceMapShellMachine(state, {
      type: "sheetSettled",
      snap: "collapsed",
    });

    expect(settled.effects).toEqual([
      flySync,
      { type: "flyToItem", location: { lat: 3, lng: 4 } },
    ]);
    expect(settled.state.selectedItemId).toBe("b");
  });
});
