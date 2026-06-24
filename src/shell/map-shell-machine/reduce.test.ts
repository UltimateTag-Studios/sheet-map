import { describe, expect, it } from "vitest";

import {
  createInitialMapShellSelectionState,
  type MapShellSelectionState,
  reduceMapShellSelection,
} from "./index";

function baseState(
  overrides: Partial<MapShellSelectionState> = {},
): MapShellSelectionState {
  return {
    ...createInitialMapShellSelectionState(),
    ...overrides,
  };
}

describe("reduceMapShellSelection", () => {
  it("updates sheet snap", () => {
    const state = baseState();

    const next = reduceMapShellSelection(state, {
      type: "sheetSnapChange",
      snap: "half",
    });

    expect(next.sheetSnap).toBe("half");
  });

  it("selectItem with deferSheetOpen keeps sheet collapsed and flies first", () => {
    const state = baseState();

    const next = reduceMapShellSelection(state, {
      type: "selectItem",
      id: "a",
      location: { lat: 1, lng: 2 },
      flyImmediately: false,
      deferSheetOpen: true,
    });

    expect(next.selectedItemId).toBe("a");
    expect(next.sheetSnap).toBe("collapsed");
    expect(next.itemSelectCamera).toEqual({
      status: "flyingToItem",
      location: { lat: 1, lng: 2 },
    });
  });

  it("flyCompletedOpenSheet opens half after fly", () => {
    const state = baseState({
      selectedItemId: "a",
      sheetSnap: "collapsed",
      itemSelectCamera: {
        status: "flyingToItem",
        location: { lat: 1, lng: 2 },
      },
    });

    const next = reduceMapShellSelection(state, {
      type: "flyCompletedOpenSheet",
    });

    expect(next.sheetSnap).toBe("half");
    expect(next.itemSelectCamera).toEqual({ status: "idle" });
  });

  it("selectItem without defer opens half immediately", () => {
    const state = baseState();

    const next = reduceMapShellSelection(state, {
      type: "selectItem",
      id: "a",
      location: null,
      flyImmediately: false,
      deferSheetOpen: false,
    });

    expect(next.sheetSnap).toBe("half");
    expect(next.itemSelectCamera).toEqual({ status: "idle" });
  });

  it("clearSelection is idempotent", () => {
    const state = baseState({ selectedItemId: "a" });

    const cleared = reduceMapShellSelection(state, { type: "clearSelection" });
    expect(cleared.selectedItemId).toBeNull();
    expect(cleared.itemSelectCamera).toEqual({ status: "idle" });

    const again = reduceMapShellSelection(cleared, { type: "clearSelection" });
    expect(again).toBe(cleared);
  });

  it("closeSheet collapses and clears selection", () => {
    const state = baseState({ sheetSnap: "half", selectedItemId: "a" });

    const next = reduceMapShellSelection(state, { type: "closeSheet" });

    expect(next.sheetSnap).toBe("collapsed");
    expect(next.selectedItemId).toBeNull();
  });
});
