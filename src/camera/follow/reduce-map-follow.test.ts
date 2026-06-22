import { describe, expect, it } from "vitest";

import { reduceMapFollow } from "./reduce-map-follow";
import { createInitialMapFollowState } from "./state";

describe("reduceMapFollow", () => {
  it("starts with tracking when requested", () => {
    const state = createInitialMapFollowState({ tracking: true });
    expect(state.tracking).toBe(true);
  });

  it("stops tracking on pan commit", () => {
    const state = createInitialMapFollowState({ tracking: true });
    const next = reduceMapFollow(state, { type: "stopTracking" });
    expect(next.tracking).toBe(false);
  });

  it("starts tracking when boot is issued", () => {
    const state = createInitialMapFollowState({ tracking: false });
    const next = reduceMapFollow(state, { type: "bootIssued" });
    expect(next.tracking).toBe(true);
  });
});
