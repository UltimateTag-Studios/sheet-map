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
  it("updates sheet snap", () => {
    const state = baseState();

    const result = reduceMapShellMachine(state, {
      type: "sheetSnapChange",
      snap: "half",
    });

    expect(result.state.sheetSnap).toBe("half");
    expect(result.effects).toEqual([]);
  });

  it("selectItem from collapsed emits fly and enters flyThenOpen", () => {
    const state = baseState();

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
    });

    expect(result.state.selectedItemId).toBe("a");
    expect(result.state.sheetSnap).toBe("collapsed");
    expect(result.state.itemSelect).toEqual({
      status: "flyThenOpen",
      location: { lat: 1, lng: 2 },
      cameraStage: "pending",
    });
    expect(result.effects).toEqual([
      { type: "flyToItem", location: { lat: 1, lng: 2 } },
    ]);
  });

  it("selectItem at half emits fly without changing snap", () => {
    const state = baseState({ sheetSnap: "half" });

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
    });

    expect(result.state.sheetSnap).toBe("half");
    expect(result.state.itemSelect).toEqual({ status: "idle" });
    expect(result.effects).toEqual([
      { type: "flyToItem", location: { lat: 1, lng: 2 } },
    ]);
  });

  it("selectItem without location opens half without flying", () => {
    const state = baseState();

    const result = reduceMapShellMachine(state, {
      type: "selectItem",
      id: "a",
      location: null,
    });

    expect(result.state.sheetSnap).toBe("half");
    expect(result.state.itemSelect).toEqual({ status: "idle" });
    expect(result.effects).toEqual([]);
  });

  it("camera session flying advances flyThenOpen to inFlight", () => {
    const state = baseState({
      selectedItemId: "a",
      itemSelect: {
        status: "flyThenOpen",
        location: { lat: 1, lng: 2 },
        cameraStage: "pending",
      },
    });

    const result = reduceMapShellMachine(state, {
      type: "cameraSessionChanged",
      session: "flying",
    });

    expect(result.state.itemSelect).toEqual({
      status: "flyThenOpen",
      location: { lat: 1, lng: 2 },
      cameraStage: "inFlight",
    });
  });

  it("camera session idle after inFlight opens half", () => {
    const state = baseState({
      selectedItemId: "a",
      sheetSnap: "collapsed",
      cameraSession: "flying",
      itemSelect: {
        status: "flyThenOpen",
        location: { lat: 1, lng: 2 },
        cameraStage: "inFlight",
      },
    });

    const result = reduceMapShellMachine(state, {
      type: "cameraSessionChanged",
      session: "idle",
    });

    expect(result.state.sheetSnap).toBe("half");
    expect(result.state.itemSelect).toEqual({ status: "idle" });
  });

  it("clearSelection is idempotent", () => {
    const state = baseState({ selectedItemId: "a" });

    const cleared = reduceMapShellMachine(state, { type: "clearSelection" });
    expect(cleared.state.selectedItemId).toBeNull();

    const again = reduceMapShellMachine(cleared.state, {
      type: "clearSelection",
    });
    expect(again.state).toBe(cleared.state);
  });

  it("closeSheet collapses and clears selection", () => {
    const state = baseState({ sheetSnap: "half", selectedItemId: "a" });

    const result = reduceMapShellMachine(state, { type: "closeSheet" });

    expect(result.state.sheetSnap).toBe("collapsed");
    expect(result.state.selectedItemId).toBeNull();
  });
});
