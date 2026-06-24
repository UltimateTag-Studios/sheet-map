import { describe, expect, it } from "vitest";

import { reduceMapShellMachine } from "./machine";
import {
  createInitialMapShellMachineState,
  type MapShellEnvironment,
  type MapShellMachineState,
} from "./state";

const defaultEnvironment = createInitialMapShellMachineState().environment;

function env(
  overrides: Partial<MapShellEnvironment> = {},
): MapShellEnvironment {
  return { ...defaultEnvironment, ...overrides };
}

function baseState(
  overrides: Partial<MapShellMachineState> = {},
): MapShellMachineState {
  const base = createInitialMapShellMachineState();
  const merged: MapShellMachineState = { ...base, ...overrides };
  if (
    overrides.sheetSnap !== undefined &&
    overrides.reportedSheetSnap === undefined
  ) {
    merged.reportedSheetSnap = overrides.sheetSnap;
  }
  if (
    overrides.reportedSheetSnap !== undefined &&
    overrides.environment === undefined
  ) {
    merged.environment = env({ physicalSnap: merged.reportedSheetSnap });
  }
  if (overrides.environment) {
    merged.environment = env(overrides.environment);
  }
  return merged;
}

const readyEnv = env({
  sheetMotionPhase: "idle",
  mapPaddingReady: true,
  hasUserLocation: true,
});

describe("reduceMapShellMachine", () => {
  it("selectItem from collapsed emits fly with openHalfAfterCameraIdle intent", () => {
    const state = baseState({ environment: readyEnv });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
    });

    expect(result.state.selectedItemId).toBe("a");
    expect(result.state.sheetSnap).toBe("collapsed");
    expect(result.state.intent).toEqual({
      itemId: "a",
      camera: null,
      sheetTarget: "collapsed",
      openHalfAfterCameraIdle: true,
    });
    expect(result.effects).toEqual([
      { type: "flyToItem", location: { lat: 1, lng: 2 } },
    ]);
  });

  it("opens half after camera flying to idle for collapsed fly-first select", () => {
    const state = baseState({
      environment: env({ ...readyEnv, cameraSession: "flying" }),
      intent: {
        itemId: "a",
        camera: null,
        sheetTarget: "collapsed",
        openHalfAfterCameraIdle: true,
      },
    });

    const result = reduceMapShellMachine(state, {
      type: "environmentSynced",
      environment: env({ ...readyEnv, cameraSession: "idle" }),
    });

    expect(result.state.sheetSnap).toBe("half");
    expect(result.state.intent).toBeNull();
  });

  it("selectItem at half flies immediately", () => {
    const state = baseState({
      sheetSnap: "half",
      environment: env({ ...readyEnv, physicalSnap: "half" }),
    });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
    });

    expect(result.state.sheetSnap).toBe("half");
    expect(result.effects).toEqual([
      { type: "flyToItem", location: { lat: 1, lng: 2 } },
    ]);
  });

  it("selectItem at full commands half and defers fly until physical half", () => {
    const state = baseState({
      sheetSnap: "full",
      reportedSheetSnap: "full",
      environment: env({ ...readyEnv, physicalSnap: "full" }),
    });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
    });

    expect(result.state.sheetSnap).toBe("half");
    expect(result.state.intent?.camera).toEqual({
      kind: "flyToItem",
      location: { lat: 1, lng: 2 },
    });
    expect(result.effects).toEqual([]);
  });

  it("full reselect B while A selected at physical full slides to half then flies", () => {
    const state = baseState({
      sheetSnap: "half",
      reportedSheetSnap: "full",
      selectedItemId: "a",
      environment: env({ ...readyEnv, physicalSnap: "full" }),
    });

    const select = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "b",
      location: { lat: 3, lng: 4 },
    });

    expect(select.state.sheetSnap).toBe("half");
    expect(select.effects).toEqual([]);

    const afterHalf = reduceMapShellMachine(select.state, {
      type: "sheetReported",
      snap: "half",
      phase: "idle",
      settled: true,
    });

    expect(afterHalf.effects).toEqual([
      { type: "flyToItem", location: { lat: 3, lng: 4 } },
    ]);
  });

  it("defers fly while sheet is dragging", () => {
    const state = baseState({
      environment: env({
        ...readyEnv,
        sheetMotionPhase: "dragging",
        physicalSnap: "half",
      }),
    });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
    });

    expect(result.effects).toEqual([]);
    expect(result.state.intent?.camera).toBeTruthy();
  });

  it("selectItem at half with stale layout physicalSnap still flies when reported half", () => {
    const state = baseState({
      sheetSnap: "half",
      reportedSheetSnap: "half",
      environment: env({
        ...readyEnv,
        physicalSnap: "collapsed",
      }),
    });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
    });

    expect(result.effects).toEqual([
      { type: "flyToItem", location: { lat: 1, lng: 2 } },
    ]);
  });

  it("recenterUser at full flies without changing sheet snap", () => {
    const state = baseState({
      sheetSnap: "full",
      selectedItemId: "a",
      environment: env({ ...readyEnv, physicalSnap: "full" }),
    });

    const result = reduceMapShellMachine(state, {
      type: "recenterUser",
    });

    expect(result.state.selectedItemId).toBeNull();
    expect(result.state.sheetSnap).toBe("full");
    expect(result.effects).toEqual([{ type: "flyToUser" }]);
  });

  it("recenterUser during drag defers fly", () => {
    const state = baseState({
      sheetSnap: "full",
      environment: env({
        ...readyEnv,
        sheetMotionPhase: "dragging",
        physicalSnap: "full",
      }),
    });

    const result = reduceMapShellMachine(state, { type: "recenterUser" });

    expect(result.effects).toEqual([]);
    expect(result.state.intent?.camera).toEqual({ kind: "flyToUser" });
    expect(result.state.sheetSnap).toBe("full");
  });

  it("latest intent wins when selecting during an in-flight camera move", () => {
    const state = baseState({
      environment: env({ ...readyEnv, cameraSession: "flying" }),
      intent: {
        itemId: "a",
        camera: null,
        sheetTarget: "collapsed",
        openHalfAfterCameraIdle: true,
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
        itemId: "a",
        camera: { kind: "flyToItem", location: { lat: 1, lng: 2 } },
        sheetTarget: "half",
        openHalfAfterCameraIdle: false,
      },
    });

    const result = reduceMapShellMachine(state, { type: "dismissSheet" });

    expect(result.state.sheetSnap).toBe("collapsed");
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
});
