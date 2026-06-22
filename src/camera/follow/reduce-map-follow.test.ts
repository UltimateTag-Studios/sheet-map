import { describe, expect, it } from "vitest";

import { reduceMapFollow } from "./reduce-map-follow";
import { createInitialMapFollowState } from "./state";

describe("reduceMapFollow", () => {
  it("starts with tracking when requested", () => {
    const state = createInitialMapFollowState({ tracking: true });
    expect(state.tracking).toBe(true);
    expect(state.hasBootFlown).toBe(false);
  });

  it("stops tracking on pan commit", () => {
    const state = createInitialMapFollowState({ tracking: true });
    const next = reduceMapFollow(state, { type: "stopTracking" });
    expect(next.tracking).toBe(false);
  });

  it("records boot jump once and starts tracking", () => {
    const state = createInitialMapFollowState({ tracking: false });
    const next = reduceMapFollow(state, { type: "bootFlown" });
    expect(next.hasBootFlown).toBe(true);
    expect(next.tracking).toBe(true);
  });

  it("resets boot when the map instance changes", () => {
    const booted = reduceMapFollow(
      createInitialMapFollowState({ tracking: false }),
      { type: "bootFlown" },
    );
    const next = reduceMapFollow(booted, { type: "resetBoot" });
    expect(next.hasBootFlown).toBe(false);
    expect(next.tracking).toBe(true);
  });
});
