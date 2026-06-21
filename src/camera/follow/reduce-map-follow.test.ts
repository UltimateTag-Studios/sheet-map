import { describe, expect, it } from "vitest";

import { reduceMapFollow } from "./reduce-map-follow";
import { createInitialMapFollowState } from "./state";

describe("reduceMapFollow", () => {
  it("starts with autoFollow when user location is available", () => {
    const state = createInitialMapFollowState({ autoFollow: true });
    expect(state.followUser).toBe(true);
    expect(state.hasBootFlown).toBe(false);
  });

  it("stops follow on pan commit", () => {
    const state = createInitialMapFollowState({ autoFollow: true });
    const next = reduceMapFollow(state, { type: "stopFollowUser" });
    expect(next.followUser).toBe(false);
  });

  it("records boot jump once", () => {
    const state = createInitialMapFollowState({ autoFollow: true });
    const next = reduceMapFollow(state, { type: "bootFlown" });
    expect(next.hasBootFlown).toBe(true);
    expect(next.followUser).toBe(true);
  });
});
