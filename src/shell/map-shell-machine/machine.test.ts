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
  return {
    ...createInitialMapShellMachineState(),
    ...overrides,
  };
}

describe("reduceMapShellMachine", () => {
  it("selectItem from collapsed emits fly and enters flyingToItem", () => {
    const state = baseState();

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
    });

    expect(result.state.selectedItemId).toBe("a");
    expect(result.state.sheetSnap).toBe("collapsed");
    expect(result.state.itemSelect).toEqual({
      status: "flyingToItem",
      location: { lat: 1, lng: 2 },
    });
    expect(result.effects).toEqual([
      { type: "flyToItem", location: { lat: 1, lng: 2 } },
    ]);
  });

  it("opens half when environment reports flying then idle", () => {
    const state = baseState({
      selectedItemId: "a",
      sheetSnap: "collapsed",
      environment: env({ cameraSession: "flying", sheetMotionPhase: "idle" }),
      itemSelect: {
        status: "flyingToItem",
        location: { lat: 1, lng: 2 },
      },
    });

    const result = reduceMapShellMachine(state, {
      type: "environmentSynced",
      environment: env(),
    });

    expect(result.state.sheetSnap).toBe("half");
    expect(result.state.itemSelect).toEqual({ status: "idle" });
  });

  it("does not open half on unchanged idle environment while flyingToItem", () => {
    const state = baseState({
      selectedItemId: "a",
      sheetSnap: "collapsed",
      itemSelect: {
        status: "flyingToItem",
        location: { lat: 1, lng: 2 },
      },
    });

    const result = reduceMapShellMachine(state, {
      type: "environmentSynced",
      environment: state.environment,
    });

    expect(result.state).toBe(state);
  });

  it("does not open half on idle to idle without a flying session", () => {
    const state = baseState({
      selectedItemId: "a",
      sheetSnap: "collapsed",
      environment: env(),
      itemSelect: {
        status: "flyingToItem",
        location: { lat: 1, lng: 2 },
      },
    });

    const result = reduceMapShellMachine(state, {
      type: "environmentSynced",
      environment: env(),
    });

    expect(result.state.sheetSnap).toBe("collapsed");
  });

  it("sheetReported idle at collapsed dismisses selection", () => {
    const state = baseState({
      sheetSnap: "half",
      selectedItemId: "a",
    });

    const result = reduceMapShellMachine(state, {
      type: "sheetReported",
      snap: "collapsed",
      phase: "idle",
    });

    expect(result.state.sheetSnap).toBe("collapsed");
    expect(result.state.selectedItemId).toBeNull();
  });

  it("sheetReported dragging does not dismiss when passing collapsed", () => {
    const state = baseState({
      sheetSnap: "half",
      selectedItemId: "a",
    });

    const result = reduceMapShellMachine(state, {
      type: "sheetReported",
      snap: "collapsed",
      phase: "dragging",
    });

    expect(result.state.sheetSnap).toBe("collapsed");
    expect(result.state.selectedItemId).toBe("a");
  });

  it("dismissSheet collapses and clears selection", () => {
    const state = baseState({ sheetSnap: "half", selectedItemId: "a" });

    const result = reduceMapShellMachine(state, { type: "dismissSheet" });

    expect(result.state.sheetSnap).toBe("collapsed");
    expect(result.state.selectedItemId).toBeNull();
  });

  it("queues pendingFly when selecting during sheet motion", () => {
    const state = baseState({
      sheetSnap: "half",
      environment: env({ sheetMotionPhase: "settling" }),
    });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "b",
      location: { lat: 3, lng: 4 },
    });

    expect(result.state.selectedItemId).toBe("b");
    expect(result.state.itemSelect).toEqual({
      status: "pendingFly",
      location: { lat: 3, lng: 4 },
    });
    expect(result.effects).toEqual([]);
  });

  it("flies pending selection once sheet motion returns to idle at half", () => {
    const state = baseState({
      sheetSnap: "half",
      selectedItemId: "b",
      environment: env({ sheetMotionPhase: "settling" }),
      itemSelect: {
        status: "pendingFly",
        location: { lat: 3, lng: 4 },
      },
    });

    const result = reduceMapShellMachine(state, {
      type: "environmentSynced",
      environment: env(),
    });

    expect(result.state.selectedItemId).toBe("b");
    expect(result.state.sheetSnap).toBe("half");
    expect(result.state.itemSelect).toEqual({ status: "idle" });
    expect(result.effects).toEqual([
      { type: "flyToItem", location: { lat: 3, lng: 4 } },
    ]);
  });

  it("selectItem B at half when A is selected flies immediately", () => {
    const state = baseState({
      sheetSnap: "half",
      selectedItemId: "a",
      environment: env(),
    });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "b",
      location: { lat: 3, lng: 4 },
    });

    expect(result.state.selectedItemId).toBe("b");
    expect(result.state.sheetSnap).toBe("half");
    expect(result.effects).toEqual([
      { type: "flyToItem", location: { lat: 3, lng: 4 } },
    ]);
  });

  it("sheetReported idle collapsed clears pendingFly", () => {
    const state = baseState({
      sheetSnap: "half",
      selectedItemId: "a",
      itemSelect: {
        status: "pendingFly",
        location: { lat: 1, lng: 2 },
      },
    });

    const result = reduceMapShellMachine(state, {
      type: "sheetReported",
      snap: "collapsed",
      phase: "idle",
    });

    expect(result.state.selectedItemId).toBeNull();
    expect(result.state.itemSelect).toEqual({ status: "idle" });
  });

  it("routeEnterFlyChanged clears selection when route unregisters", () => {
    const state = baseState({
      selectedItemId: "capture-a",
      sheetSnap: "half",
      routeVisit: {
        routeKey: "trail-a",
        entry: {
          kind: "item",
          id: "capture-a",
          location: { lat: 1, lng: 2 },
        },
        applyStatus: "satisfied",
      },
    });

    const result = reduceMapShellMachine(state, {
      type: "routeEnterFlyChanged",
      routeKey: "",
      entry: null,
    });

    expect(result.state.selectedItemId).toBeNull();
    expect(result.state.routeVisit).toBeNull();
  });

  it("routeEnterFlyChanged to a new route clears prior selection and applies entry", () => {
    const state = baseState({
      selectedItemId: "capture-a",
      sheetSnap: "half",
      routeVisit: {
        routeKey: "trail-a",
        entry: {
          kind: "item",
          id: "capture-a",
          location: { lat: 1, lng: 2 },
        },
        applyStatus: "satisfied",
      },
      environment: env({
        mapPaddingReady: true,
        hasUserLocation: true,
      }),
    });

    const result = reduceMapShellMachine(state, {
      type: "routeEnterFlyChanged",
      routeKey: "inventory",
      entry: { kind: "userLocation" },
    });

    expect(result.state.selectedItemId).toBeNull();
    expect(result.state.itemSelect).toEqual({ status: "idle" });
    expect(result.state.routeVisit).toEqual({
      routeKey: "inventory",
      entry: { kind: "userLocation" },
      applyStatus: "dispatched",
    });
    expect(result.effects).toEqual([{ type: "flyToUser" }]);
  });

  it("marks user enter fly satisfied when camera returns to idle", () => {
    const dispatched = baseState({
      routeVisit: {
        routeKey: "inventory",
        entry: { kind: "userLocation" },
        applyStatus: "dispatched",
      },
      environment: env({
        cameraSession: "flying",
        mapPaddingReady: true,
        hasUserLocation: true,
      }),
    });

    const result = reduceMapShellMachine(dispatched, {
      type: "environmentSynced",
      environment: env({
        cameraSession: "idle",
        mapPaddingReady: true,
        hasUserLocation: true,
      }),
    });

    expect(result.state.routeVisit?.applyStatus).toBe("satisfied");
    expect(result.effects).toEqual([]);
  });

  it("routeEnterFlyChanged selects item when gates are ready", () => {
    const state = baseState({
      environment: env({
        mapPaddingReady: true,
      }),
    });

    const result = reduceMapShellMachine(state, {
      type: "routeEnterFlyChanged",
      routeKey: "trail-a",
      entry: {
        kind: "item",
        id: "capture-a",
        location: { lat: 1, lng: 2 },
      },
    });

    expect(result.state.selectedItemId).toBe("capture-a");
    expect(result.state.routeVisit).toEqual({
      routeKey: "trail-a",
      entry: {
        kind: "item",
        id: "capture-a",
        location: { lat: 1, lng: 2 },
      },
      applyStatus: "dispatched",
    });
    expect(result.effects).toEqual([
      { type: "flyToItem", location: { lat: 1, lng: 2 }, enterFly: true },
    ]);
  });

  it("dispatches route item entry once when environment gates open", () => {
    const state = baseState({
      routeVisit: {
        routeKey: "trail-a",
        entry: {
          kind: "item",
          id: "capture-a",
          location: { lat: 1, lng: 2 },
        },
        applyStatus: "waiting",
      },
      environment: env({
        sheetMotionPhase: "settling",
        mapPaddingReady: true,
      }),
    });

    const settled = reduceMapShellMachine(state, {
      type: "environmentSynced",
      environment: env({ mapPaddingReady: true }),
    });

    expect(settled.state.selectedItemId).toBe("capture-a");
    expect(settled.effects).toEqual([
      { type: "flyToItem", location: { lat: 1, lng: 2 }, enterFly: true },
    ]);
  });

  it("clearSelection dismisses route entry apply status", () => {
    const state = baseState({
      selectedItemId: "capture-a",
      routeVisit: {
        routeKey: "trail-a",
        entry: {
          kind: "item",
          id: "capture-a",
          location: { lat: 1, lng: 2 },
        },
        applyStatus: "satisfied",
      },
    });

    const result = reduceMapShellMachine(state, {
      type: "clearSelection",
      dismissRouteEntry: true,
    });

    expect(result.state.selectedItemId).toBeNull();
    expect(result.state.routeVisit?.applyStatus).toBe("dismissed");
  });

  it("re-arms route entry to waiting when collapse interrupts unsatisfied selection", () => {
    const state = baseState({
      sheetSnap: "half",
      selectedItemId: "a",
      itemSelect: {
        status: "pendingFly",
        location: { lat: 1, lng: 2 },
      },
      routeVisit: {
        routeKey: "trail-a",
        entry: {
          kind: "item",
          id: "capture-a",
          location: { lat: 3, lng: 4 },
        },
        applyStatus: "waiting",
      },
    });

    const result = reduceMapShellMachine(state, {
      type: "sheetReported",
      snap: "collapsed",
      phase: "idle",
    });

    expect(result.state.selectedItemId).toBeNull();
    expect(result.state.routeVisit?.applyStatus).toBe("waiting");
  });
});
