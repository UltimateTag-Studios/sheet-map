import { describe, expect, it } from "vitest";

import { reduceMapShellMachine } from "./machine";
import {
  createInitialMapShellMachineState,
  type MapShellMachineState,
} from "./state";

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
      environment: { cameraSession: "flying", sheetMotionPhase: "idle" },
      itemSelect: {
        status: "flyingToItem",
        location: { lat: 1, lng: 2 },
      },
    });

    const result = reduceMapShellMachine(state, {
      type: "environmentSynced",
      environment: { cameraSession: "idle", sheetMotionPhase: "idle" },
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
      environment: { cameraSession: "idle", sheetMotionPhase: "idle" },
    });

    expect(result.state).toBe(state);
  });

  it("does not open half on idle to idle without a flying session", () => {
    const state = baseState({
      selectedItemId: "a",
      sheetSnap: "collapsed",
      environment: { cameraSession: "idle", sheetMotionPhase: "idle" },
      itemSelect: {
        status: "flyingToItem",
        location: { lat: 1, lng: 2 },
      },
    });

    const result = reduceMapShellMachine(state, {
      type: "environmentSynced",
      environment: { cameraSession: "idle", sheetMotionPhase: "idle" },
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
});
