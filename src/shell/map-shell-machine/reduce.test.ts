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

  it("ignores duplicate snap change", () => {
    const state = baseState({ sheetSnap: "half" });

    const next = reduceMapShellSelection(state, {
      type: "sheetSnapChange",
      snap: "half",
    });

    expect(next).toBe(state);
  });

  it("clears selection when the sheet settles collapsed from open", () => {
    const state = baseState({
      sheetSnap: "half",
      selectedItemId: "a",
    });

    const next = reduceMapShellSelection(state, { type: "closeSheet" });

    expect(next.sheetSnap).toBe("collapsed");
    expect(next.selectedItemId).toBeNull();
  });

  it("clears selection after drag when snap already changed to collapsed", () => {
    const state = baseState({
      sheetSnap: "collapsed",
      selectedItemId: "a",
    });

    const next = reduceMapShellSelection(state, { type: "closeSheet" });

    expect(next.sheetSnap).toBe("collapsed");
    expect(next.selectedItemId).toBeNull();
  });

  it("selectItem opens half", () => {
    const state = baseState();

    const next = reduceMapShellSelection(state, {
      type: "selectItem",
      id: "a",
    });

    expect(next.selectedItemId).toBe("a");
    expect(next.sheetSnap).toBe("half");
  });

  it("clearSelection is idempotent", () => {
    const state = baseState({ selectedItemId: "a" });

    const cleared = reduceMapShellSelection(state, { type: "clearSelection" });
    expect(cleared.selectedItemId).toBeNull();

    const again = reduceMapShellSelection(cleared, { type: "clearSelection" });
    expect(again).toBe(cleared);
  });

  it("closeSheet collapses and clears selection", () => {
    const state = baseState({ sheetSnap: "half", selectedItemId: "a" });

    const next = reduceMapShellSelection(state, { type: "closeSheet" });

    expect(next.sheetSnap).toBe("collapsed");
    expect(next.selectedItemId).toBeNull();
  });

  it("closeSheet is a no-op when already collapsed without selection", () => {
    const state = baseState();

    const next = reduceMapShellSelection(state, { type: "closeSheet" });

    expect(next).toBe(state);
  });
});
