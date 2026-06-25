import { describe, expect, it } from "vitest";

import { reduceMapShellMachine } from "./reduce";
import {
  createInitialMapShellMachineState,
  type MapShellCameraSnapshot,
  type MapShellMachineState,
} from "./state";
import {
  cameraHasUserLocationChanged,
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

describe("reduceMapShellMachine", () => {
  it("selectItem from collapsed emits fly with awaitCameraIdleForHalf intent", () => {
    const state = baseState({ cameraSnapshot: readySnapshot });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
    });

    expect(result.state.selectedItemId).toBe("a");
    expect(result.state.sheetTarget).toBe("collapsed");
    expect(result.state.intent).toEqual({
      phase: "awaitCameraIdleForHalf",
      itemId: "a",
    });
    expect(result.effects).toEqual([
      { type: "syncCameraSheetPhase", phase: "idle" },
      { type: "flyToItem", location: { lat: 1, lng: 2 }, mode: "fly" },
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

    const result = reduceMapShellMachine(
      state,
      cameraSessionChanged("idle", "flying"),
    );

    expect(result.state.sheetTarget).toBe("half");
    expect(result.state.intent).toBeNull();
  });

  it("selectItem at half flies immediately", () => {
    const state = baseState({
      sheetSnap: "half",
      sheetTarget: null,
      cameraSnapshot: readySnapshot,
    });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
    });

    expect(result.state.sheetTarget).toBe("half");
    expect(result.effects).toEqual([
      { type: "syncCameraSheetPhase", phase: "idle" },
      { type: "flyToItem", location: { lat: 1, lng: 2 }, mode: "fly" },
    ]);
  });

  it("selectItem at full commands half and defers fly until sheetSnap half", () => {
    const state = baseState({
      sheetSnap: "full",
      sheetTarget: null,
      cameraSnapshot: readySnapshot,
    });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
    });

    expect(result.state.sheetTarget).toBe("half");
    expect(result.state.intent?.phase).toBe("awaitGates");
    if (result.state.intent?.phase === "awaitGates") {
      expect(result.state.intent.camera).toEqual({
        kind: "flyToItem",
        location: { lat: 1, lng: 2 },
      });
    }
    expect(result.effects).toEqual([]);
  });

  it("full reselect B after pan flies when half snap arrives", () => {
    const afterPan = baseState({
      sheetSnap: "full",
      sheetTarget: null,
      selectedItemId: "a",
      cameraSnapshot: readySnapshot,
    });

    const panned = reduceMapShellMachine(
      afterPan,
      cameraSessionChanged("userGesture", "idle"),
    );
    const panDone = reduceMapShellMachine(
      panned.state,
      cameraSessionChanged("idle", "userGesture"),
    );

    const select = reduceMapShellMachine(panDone.state, {
      type: "selectItem",
      id: "b",
      location: { lat: 3, lng: 4 },
    });

    expect(select.state.sheetTarget).toBe("half");
    expect(select.effects).toEqual([]);

    const afterHalf = reduceMapShellMachine(
      reduceMapShellMachine(
        reduceMapShellMachine(select.state, {
          type: "sheetLayoutFrameChanged",
          phase: "settling",
          restingSnap: "half",
        }).state,
        { type: "sheetSettled", snap: "half" },
      ).state,
      {
        type: "sheetLayoutFrameChanged",
        phase: "idle",
        restingSnap: "half",
      },
    );

    expect(afterHalf.effects).toEqual([
      { type: "syncCameraSheetPhase", phase: "idle" },
      { type: "flyToItem", location: { lat: 3, lng: 4 }, mode: "fly" },
    ]);
  });

  it("full reselect B while A selected at sheetSnap full slides to half then flies", () => {
    const state = baseState({
      sheetSnap: "full",
      sheetTarget: null,
      selectedItemId: "a",
      cameraSnapshot: readySnapshot,
    });

    const select = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "b",
      location: { lat: 3, lng: 4 },
    });

    expect(select.state.sheetTarget).toBe("half");
    expect(select.effects).toEqual([]);

    const afterHalf = reduceMapShellMachine(
      reduceMapShellMachine(
        reduceMapShellMachine(select.state, {
          type: "sheetLayoutFrameChanged",
          phase: "settling",
          restingSnap: "half",
        }).state,
        { type: "sheetSettled", snap: "half" },
      ).state,
      {
        type: "sheetLayoutFrameChanged",
        phase: "idle",
        restingSnap: "half",
      },
    );

    expect(afterHalf.effects).toEqual([
      { type: "syncCameraSheetPhase", phase: "idle" },
      { type: "flyToItem", location: { lat: 3, lng: 4 }, mode: "fly" },
    ]);
  });

  it("user drag to full syncs sheetTarget on snap change start", () => {
    const state = baseState({
      sheetSnap: "half",
      sheetTarget: null,
      cameraSnapshot: readySnapshot,
    });

    const result = reduceMapShellMachine(state, {
      type: "sheetSnapChangeStarted",
      snap: "full",
    });

    expect(result.state.sheetTarget).toBe("full");
    expect(result.state.sheetSnap).toBe("half");
  });

  it("emits jump while sheet is dragging (I11)", () => {
    const state = baseState({
      sheetPhase: "dragging",
      sheetSnap: "half",
      cameraSnapshot: readySnapshot,
    });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
    });

    expect(result.effects).toEqual([
      { type: "syncCameraSheetPhase", phase: "dragging" },
      { type: "flyToItem", location: { lat: 1, lng: 2 }, mode: "jump" },
    ]);
    expect(result.state.intent?.phase).toBe("awaitGates");
  });

  it("defers fly when sheetSnap has not reached intent sheetTarget", () => {
    const state = baseState({
      sheetSnap: "full",
      sheetTarget: "half",
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
      sheetSnap: "full",
      sheetTarget: null,
      selectedItemId: "a",
      cameraSnapshot: readySnapshot,
    });

    const result = reduceMapShellMachine(state, {
      type: "recenterUser",
    });

    expect(result.state.selectedItemId).toBeNull();
    expect(result.state.sheetSnap).toBe("full");
    expect(result.state.sheetTarget).toBeNull();
    expect(result.effects).toEqual([
      { type: "syncCameraSheetPhase", phase: "idle" },
      { type: "flyToUser", zoom: 14, mode: "fly" },
    ]);
  });

  it("recenterUser during drag emits jump immediately", () => {
    const state = baseState({
      sheetSnap: "full",
      sheetTarget: null,
      sheetPhase: "dragging",
      cameraSnapshot: readySnapshot,
    });

    const result = reduceMapShellMachine(state, { type: "recenterUser" });

    expect(result.effects).toEqual([
      { type: "syncCameraSheetPhase", phase: "dragging" },
      { type: "flyToUser", zoom: 14, mode: "jump" },
    ]);
    if (result.state.intent?.phase === "awaitGates") {
      expect(result.state.intent.camera).toEqual({ kind: "flyToUser" });
    }
    expect(result.state.sheetSnap).toBe("full");
    expect(result.state.sheetTarget).toBeNull();
  });

  it("recenterUser cancels in-flight sheetTarget from select at full", () => {
    const state = baseState({
      sheetSnap: "full",
      sheetTarget: "half",
      selectedItemId: "a",
      cameraSnapshot: readySnapshot,
      intent: {
        phase: "awaitGates",
        itemId: "a",
        camera: { kind: "flyToItem", location: { lat: 1, lng: 2 } },
        requiredSnap: "half",
        deferFlyUntilResting: false,
        navigateEmitted: false,
      },
    });

    const result = reduceMapShellMachine(state, { type: "recenterUser" });

    expect(result.state.sheetTarget).toBeNull();
    expect(result.state.sheetSnap).toBe("full");
    expect(result.state.selectedItemId).toBeNull();
    expect(result.effects).toEqual([
      { type: "syncCameraSheetPhase", phase: "idle" },
      { type: "flyToUser", zoom: 14, mode: "fly" },
    ]);
  });

  it("clearSelection cancels in-flight sheetTarget from select at full", () => {
    const state = baseState({
      sheetSnap: "full",
      sheetTarget: "half",
      selectedItemId: "a",
    });

    const result = reduceMapShellMachine(state, {
      type: "clearSelection",
      dismissRouteEntry: true,
    });

    expect(result.state.sheetTarget).toBeNull();
    expect(result.state.sheetSnap).toBe("full");
    expect(result.state.selectedItemId).toBeNull();
  });

  it("recenterUser during half slide cancels sheetTarget", () => {
    const state = baseState({
      sheetSnap: "full",
      sheetTarget: "half",
      sheetPhase: "settling",
      selectedItemId: "a",
      cameraSnapshot: readySnapshot,
    });

    const result = reduceMapShellMachine(state, { type: "recenterUser" });

    expect(result.state.sheetTarget).toBeNull();
    expect(result.effects).toEqual([]);
  });

  it("I2: latest intent wins — pivot fly immediately during in-flight camera move", () => {
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
      { type: "syncCameraSheetPhase", phase: "idle" },
      { type: "flyToItem", location: { lat: 9, lng: 8 }, mode: "fly" },
    ]);
  });

  it("dismissSheet sets sheetTarget collapsed and clears intent", () => {
    const state = baseState({
      sheetSnap: "half",
      selectedItemId: "a",
      intent: {
        phase: "awaitGates",
        itemId: "a",
        camera: { kind: "flyToItem", location: { lat: 1, lng: 2 } },
        requiredSnap: "half",
        deferFlyUntilResting: false,
        navigateEmitted: false,
      },
    });

    const result = reduceMapShellMachine(state, { type: "dismissSheet" });

    expect(result.state.sheetTarget).toBe("collapsed");
    expect(result.state.sheetSnap).toBe("half");
    expect(result.state.selectedItemId).toBeNull();
    expect(result.state.intent).toBeNull();
  });

  it("select while sheet closing uses collapsed plan", () => {
    const state = baseState({
      sheetSnap: "half",
      sheetTarget: "collapsed",
      sheetPhase: "settling",
      selectedItemId: null,
      cameraSnapshot: readySnapshot,
    });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "b",
      location: { lat: 3, lng: 4 },
    });

    expect(result.state.sheetTarget).toBe("collapsed");
    if (result.state.intent?.phase === "awaitGates") {
      expect(result.state.intent.openHalfAfterFly).toBe(true);
    }
  });

  it("select during dismiss flys after collapsed layout idle", () => {
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

    const idle = reduceMapShellMachine(settled.state, {
      type: "sheetLayoutFrameChanged",
      phase: "idle",
      restingSnap: "collapsed",
    });

    expect(idle.effects).toEqual([
      { type: "syncCameraSheetPhase", phase: "idle" },
      { type: "flyToItem", location: { lat: 3, lng: 4 }, mode: "fly" },
    ]);
    expect(idle.state.intent).toEqual({
      phase: "awaitCameraIdleForHalf",
      itemId: "b",
    });
  });

  it("select during dismiss preserves intent when padding not ready at layout idle", () => {
    const notReady = snapshot({
      mapPaddingReady: false,
      hasUserLocation: true,
    });
    const state = baseState({
      sheetSnap: "half",
      sheetTarget: "collapsed",
      sheetPhase: "settling",
      selectedItemId: "b",
      cameraSnapshot: notReady,
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
    expect(settled.state.intent?.phase).toBe("awaitGates");

    const idle = reduceMapShellMachine(settled.state, {
      type: "sheetLayoutFrameChanged",
      phase: "idle",
      restingSnap: "collapsed",
    });

    expect(idle.effects).toEqual([
      { type: "syncCameraSheetPhase", phase: "idle" },
    ]);

    const synced = reduceMapShellMachine(
      idle.state,
      cameraPaddingReadyChanged(true),
    );

    expect(synced.effects).toEqual([
      { type: "syncCameraSheetPhase", phase: "idle" },
      { type: "flyToItem", location: { lat: 3, lng: 4 }, mode: "fly" },
    ]);
  });

  it("plain collapsed settle deselects when no pending intent", () => {
    const state = baseState({
      sheetSnap: "half",
      sheetTarget: "collapsed",
      sheetPhase: "settling",
      selectedItemId: null,
      cameraSnapshot: readySnapshot,
    });

    const result = reduceMapShellMachine(state, {
      type: "sheetSettled",
      snap: "collapsed",
    });

    expect(result.state.selectedItemId).toBeNull();
    expect(result.state.intent).toBeNull();
    expect(result.effects).toEqual([]);
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

  it("dismissSheet dismisses route entry so close does not re-select on settle", () => {
    const itemId = "capture-1";
    const location = { lat: 1, lng: 2 };
    const state = baseState({
      sheetSnap: "half",
      sheetPhase: "resting",
      selectedItemId: itemId,
      cameraSnapshot: readySnapshot,
      routeVisit: {
        routeKey: "trail-serial",
        entry: { kind: "item", id: itemId, location },
        applyStatus: "dispatched",
      },
      intent: {
        phase: "awaitGates",
        itemId,
        camera: { kind: "flyToItem", location },
        requiredSnap: "half",
        deferFlyUntilResting: false,
        navigateEmitted: true,
      },
    });

    const dismissed = reduceMapShellMachine(state, { type: "dismissSheet" });

    expect(dismissed.state.selectedItemId).toBeNull();
    expect(dismissed.state.routeVisit?.applyStatus).toBe("dismissed");

    const settled = reduceMapShellMachine(dismissed.state, {
      type: "sheetSettled",
      snap: "collapsed",
    });

    expect(settled.state.selectedItemId).toBeNull();
    expect(settled.effects).toEqual([]);

    const afterPadding = reduceMapShellMachine(
      settled.state,
      cameraPaddingReadyChanged(true),
    );

    expect(afterPadding.state.selectedItemId).toBeNull();
    expect(afterPadding.effects).toEqual([]);
  });

  it("dismissSheet dismisses deferred route entry before padding is ready", () => {
    const itemId = "capture-1";
    const location = { lat: 1, lng: 2 };
    const state = baseState({
      sheetSnap: "half",
      selectedItemId: itemId,
      cameraSnapshot: snapshot({
        mapPaddingReady: false,
        hasUserLocation: true,
      }),
      routeVisit: {
        routeKey: "trail-serial",
        entry: { kind: "item", id: itemId, location },
        applyStatus: "waiting",
      },
      intent: {
        phase: "awaitGates",
        itemId,
        camera: { kind: "flyToItem", location },
        requiredSnap: "half",
        deferFlyUntilResting: false,
        navigateEmitted: false,
      },
    });

    const dismissed = reduceMapShellMachine(state, { type: "dismissSheet" });

    expect(dismissed.state.routeVisit?.applyStatus).toBe("dismissed");

    const afterPadding = reduceMapShellMachine(
      dismissed.state,
      cameraPaddingReadyChanged(true),
    );

    expect(afterPadding.state.selectedItemId).toBeNull();
    expect(afterPadding.effects).toEqual([]);
  });

  it("sheetLayoutFrameChanged syncs sheetTarget from restingSnap while dragging", () => {
    const state = baseState({
      sheetPhase: "resting",
      sheetSnap: "half",
      sheetTarget: null,
    });

    const result = reduceMapShellMachine(state, {
      type: "sheetLayoutFrameChanged",
      phase: "dragging",
      restingSnap: "collapsed",
    });

    expect(result.state.sheetSnap).toBe("half");
    expect(result.state.sheetTarget).toBe("collapsed");
    expect(result.state.sheetPhase).toBe("dragging");
  });

  it("select while drag-closing uses collapsed plan", () => {
    const state = baseState({
      sheetSnap: "half",
      sheetTarget: "collapsed",
      sheetPhase: "settling",
      selectedItemId: null,
      cameraSnapshot: readySnapshot,
    });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "b",
      location: { lat: 3, lng: 4 },
    });

    expect(result.state.sheetTarget).toBe("collapsed");
    if (result.state.intent?.phase === "awaitGates") {
      expect(result.state.intent.openHalfAfterFly).toBe(true);
    }
  });

  it("user drag to collapsed overrides programmatic half command", () => {
    const state = baseState({
      sheetSnap: "full",
      sheetTarget: "half",
      sheetPhase: "settling",
      cameraSnapshot: readySnapshot,
    });

    const result = reduceMapShellMachine(state, {
      type: "sheetLayoutFrameChanged",
      phase: "dragging",
      restingSnap: "collapsed",
    });

    expect(result.state.sheetTarget).toBe("collapsed");
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

  it("does not re-emit navigate on repeated dragging layout frames", () => {
    const state = baseState({
      sheetPhase: "dragging",
      sheetSnap: "half",
      sheetTarget: "collapsed",
      cameraSnapshot: readySnapshot,
      outstandingShellNavigates: 1,
      intent: {
        phase: "awaitGates",
        itemId: "b",
        camera: { kind: "flyToItem", location: { lat: 3, lng: 4 } },
        requiredSnap: null,
        deferFlyUntilResting: false,
        navigateEmitted: true,
        openHalfAfterFly: true,
      },
    });

    const result = reduceMapShellMachine(state, {
      type: "sheetLayoutFrameChanged",
      phase: "dragging",
      restingSnap: "collapsed",
    });

    expect(result.effects).toEqual([]);
  });

  it("retries flyToUser when hasUserLocation becomes available", () => {
    const state = baseState({
      cameraSnapshot: snapshot({
        mapPaddingReady: true,
        hasUserLocation: false,
      }),
      intent: {
        phase: "awaitGates",
        itemId: null,
        camera: { kind: "flyToUser" },
        requiredSnap: null,
        deferFlyUntilResting: false,
        navigateEmitted: false,
      },
    });

    const result = reduceMapShellMachine(
      state,
      cameraHasUserLocationChanged(true),
    );

    expect(result.effects).toEqual([
      { type: "syncCameraSheetPhase", phase: "idle" },
      { type: "flyToUser", zoom: 14, mode: "fly" },
    ]);
  });

  it("sheetLayoutFrameChanged updates sheetPhase only, not sheetSnap", () => {
    const state = baseState({
      sheetPhase: "resting",
      sheetSnap: "full",
    });

    const result = reduceMapShellMachine(state, {
      type: "sheetLayoutFrameChanged",
      phase: "dragging",
      restingSnap: "half",
    });

    expect(result.state.sheetSnap).toBe("full");
    expect(result.state.sheetPhase).toBe("dragging");
    expect(result.effects).toEqual([
      { type: "syncCameraSheetPhase", phase: "dragging" },
    ]);
  });
});
