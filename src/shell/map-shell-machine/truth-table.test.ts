import { describe, expect, it } from "vitest";

import { reduceMapShellMachine } from "./reduce";
import {
  createInitialMapShellMachineState,
  type MapShellCameraSnapshot,
  type MapShellMachineState,
} from "./state";
import {
  cameraNavigateSettled,
  cameraPaddingReadyChanged,
  cameraSessionChanged,
} from "./test-fixtures/camera-signals";

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

const dragSync = {
  type: "syncCameraSheetPhase" as const,
  phase: "dragging" as const,
};

function flyItem(location: { lat: number; lng: number }) {
  return { type: "flyToItem" as const, location, mode: "fly" as const };
}

function jumpItem(location: { lat: number; lng: number }) {
  return { type: "flyToItem" as const, location, mode: "jump" as const };
}

/**
 * Truth-table rows from truth-tables.md — every row gets an explicit reducer sequence.
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

    expect(select.effects).toEqual([flySync, flyItem({ lat: 1, lng: 2 })]);
    expect(select.state.intent).toEqual({
      phase: "awaitCameraIdleForHalf",
      itemId: "a",
    });

    const afterFly = reduceMapShellMachine(
      select.state,
      cameraSessionChanged("flying", "idle"),
    );

    expect(afterFly.state.sheetTarget).toBe("collapsed");

    const afterIdle = reduceMapShellMachine(
      afterFly.state,
      cameraSessionChanged("idle", "flying"),
    );

    expect(afterIdle.state.sheetTarget).toBe("half");
    expect(afterIdle.state.intent).toBeNull();
  });

  it("item at collapsed: jump fly opens half on navigate settled (padding-late retry)", () => {
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

    const paddingReady = reduceMapShellMachine(
      select.state,
      cameraPaddingReadyChanged(true),
    );

    expect(paddingReady.effects).toEqual([
      flySync,
      flyItem({ lat: 1, lng: 2 }),
    ]);
    expect(paddingReady.state.intent).toEqual({
      phase: "awaitCameraIdleForHalf",
      itemId: "a",
    });

    const afterJump = reduceMapShellMachine(
      paddingReady.state,
      cameraNavigateSettled(),
    );

    expect(afterJump.state.sheetTarget).toBe("half");
  });

  it("item at half: fly immediately", () => {
    const result = reduceMapShellMachine(
      baseState({ sheetSnap: "half", cameraSnapshot: readySnapshot }),
      { type: "selectItem", id: "a", location: { lat: 1, lng: 2 } },
    );

    expect(result.effects).toEqual([flySync, flyItem({ lat: 1, lng: 2 })]);
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

    expect(idle.effects).toEqual([flySync, flyItem({ lat: 3, lng: 4 })]);
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
    expect(layout.effects).toEqual([flySync, flyItem({ lat: 3, lng: 4 })]);
  });

  it("I2: pivot mid-fly — stale navigateSettled does not clear superseded intent", () => {
    const flyingToA = reduceMapShellMachine(
      baseState({ sheetSnap: "half", cameraSnapshot: readySnapshot }),
      { type: "selectItem", id: "a", location: { lat: 1, lng: 2 } },
    );

    expect(flyingToA.state.outstandingShellNavigates).toBe(1);

    const pivot = reduceMapShellMachine(
      {
        ...flyingToA.state,
        cameraSnapshot: snapshot({
          ...readySnapshot,
          cameraSession: "flying",
        }),
      },
      { type: "selectItem", id: "b", location: { lat: 9, lng: 8 } },
    );

    expect(pivot.effects).toEqual([flySync, flyItem({ lat: 9, lng: 8 })]);
    expect(pivot.state.outstandingShellNavigates).toBe(2);
    expect(pivot.state.selectedItemId).toBe("b");

    const staleSettle = reduceMapShellMachine(
      pivot.state,
      cameraNavigateSettled(),
    );

    expect(staleSettle.state.intent?.phase).toBe("awaitGates");
    expect(staleSettle.state.outstandingShellNavigates).toBe(1);

    const finalSettle = reduceMapShellMachine(
      staleSettle.state,
      cameraNavigateSettled(),
    );

    expect(finalSettle.state.intent).toBeNull();
    expect(finalSettle.state.outstandingShellNavigates).toBe(0);
  });

  it("I12: select while settling defers fly until layout idle", () => {
    const select = reduceMapShellMachine(
      baseState({
        sheetSnap: "full",
        sheetPhase: "settling",
        sheetTarget: "half",
        cameraSnapshot: readySnapshot,
      }),
      { type: "selectItem", id: "b", location: { lat: 3, lng: 4 } },
    );

    expect(select.effects).toEqual([]);
    expect(select.state.intent?.phase).toBe("awaitGates");
    if (select.state.intent?.phase === "awaitGates") {
      expect(select.state.intent.deferFlyUntilResting).toBe(true);
      expect(select.state.intent.navigateEmitted).toBe(false);
    }

    const idle = reduceMapShellMachine(
      reduceMapShellMachine(select.state, {
        type: "sheetSettled",
        snap: "half",
      }).state,
      {
        type: "sheetLayoutFrameChanged",
        phase: "idle",
        restingSnap: "half",
      },
    );

    expect(idle.effects).toEqual([flySync, flyItem({ lat: 3, lng: 4 })]);
  });

  it("I13: settling then dragging emits jump and skips post-settle smooth fly", () => {
    const select = reduceMapShellMachine(
      baseState({
        sheetSnap: "full",
        sheetPhase: "settling",
        sheetTarget: "half",
        cameraSnapshot: readySnapshot,
      }),
      { type: "selectItem", id: "b", location: { lat: 3, lng: 4 } },
    );

    expect(select.effects).toEqual([]);

    const dragging = reduceMapShellMachine(select.state, {
      type: "sheetLayoutFrameChanged",
      phase: "dragging",
      restingSnap: "half",
    });

    expect(dragging.effects).toEqual([dragSync, jumpItem({ lat: 3, lng: 4 })]);

    const idle = reduceMapShellMachine(
      reduceMapShellMachine(dragging.state, {
        type: "sheetSettled",
        snap: "half",
      }).state,
      {
        type: "sheetLayoutFrameChanged",
        phase: "idle",
        restingSnap: "half",
      },
    );

    expect(idle.effects).toEqual([flySync]);
  });

  it("I11: shell does not retry smooth fly after navigate already emitted", () => {
    const select = reduceMapShellMachine(
      baseState({ sheetSnap: "half", cameraSnapshot: readySnapshot }),
      { type: "selectItem", id: "a", location: { lat: 1, lng: 2 } },
    );

    expect(select.state.intent?.phase).toBe("awaitGates");
    if (select.state.intent?.phase === "awaitGates") {
      expect(select.state.intent.navigateEmitted).toBe(true);
    }

    const idle = reduceMapShellMachine(
      {
        ...select.state,
        cameraSnapshot: snapshot({ ...readySnapshot, cameraSession: "flying" }),
      },
      {
        type: "sheetLayoutFrameChanged",
        phase: "idle",
        restingSnap: "half",
      },
    );

    expect(idle.effects).toEqual([]);
    expect(idle.effects).not.toContainEqual(
      expect.objectContaining({ type: "flyToItem" }),
    );
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
        requiredSnap: "half",
        deferFlyUntilResting: false,
        navigateEmitted: false,
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
        requiredSnap: "half",
        deferFlyUntilResting: false,
        navigateEmitted: false,
      },
    });

    const dragClose = reduceMapShellMachine(stuck, {
      type: "sheetLayoutFrameChanged",
      phase: "dragging",
      restingSnap: "collapsed",
    });

    expect(dragClose.state.selectedItemId).toBeNull();
    expect(dragClose.state.intent).toBeNull();
    expect(dragClose.effects).toEqual([dragSync]);

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

  it("select-during-dismiss preserved on collapsed settle then flies on layout idle", () => {
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
        requiredSnap: null,
        deferFlyUntilResting: true,
        navigateEmitted: false,
        openHalfAfterFly: true,
      },
    });

    const settled = reduceMapShellMachine(state, {
      type: "sheetSettled",
      snap: "collapsed",
    });

    expect(settled.effects).toEqual([]);
    expect(settled.state.selectedItemId).toBe("b");

    const idle = reduceMapShellMachine(settled.state, {
      type: "sheetLayoutFrameChanged",
      phase: "idle",
      restingSnap: "collapsed",
    });

    expect(idle.effects).toEqual([flySync, flyItem({ lat: 3, lng: 4 })]);
    expect(idle.state.selectedItemId).toBe("b");
  });
});
