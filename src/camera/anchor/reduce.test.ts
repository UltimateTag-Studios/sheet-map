import { describe, expect, it } from "vitest";

import { reduceMapAnchor } from "./reduce";
import { createInitialMapAnchorState } from "./state";

const samplePosition = { lat: 1, lng: 2, zoom: 15 };
const sampleIntent = { target: samplePosition };

describe("reduceMapAnchor", () => {
  it("stores an explicit anchor without changing session", () => {
    const next = reduceMapAnchor(createInitialMapAnchorState(), {
      type: "setAnchor",
      position: samplePosition,
    });

    expect(next.anchor).toEqual(samplePosition);
    expect(next.session).toBe("idle");
    expect(next.navigationIntent).toBeNull();
  });

  it("opens a user gesture session and clears navigation intent", () => {
    const started = reduceMapAnchor(
      reduceMapAnchor(createInitialMapAnchorState(), {
        type: "navigationStarted",
        intent: sampleIntent,
      }),
      { type: "userGestureStarted" },
    );

    expect(started.session).toBe("userGesture");
    expect(started.navigationIntent).toBeNull();
  });

  it("commits anchor and closes the session on user settle", () => {
    const settled = reduceMapAnchor(
      reduceMapAnchor(createInitialMapAnchorState(), {
        type: "userGestureStarted",
      }),
      {
        type: "userGestureSettled",
        position: samplePosition,
      },
    );

    expect(settled.anchor).toEqual(samplePosition);
    expect(settled.session).toBe("idle");
  });

  it("opens a navigating session with intent", () => {
    const navigating = reduceMapAnchor(
      reduceMapAnchor(createInitialMapAnchorState(), {
        type: "setAnchor",
        position: samplePosition,
      }),
      { type: "navigationStarted", intent: sampleIntent },
    );

    expect(navigating.anchor).toEqual(samplePosition);
    expect(navigating.session).toBe("navigating");
    expect(navigating.navigationIntent).toEqual(sampleIntent);
  });

  it("closes navigating session on settle", () => {
    const settled = reduceMapAnchor(
      reduceMapAnchor(createInitialMapAnchorState(), {
        type: "navigationStarted",
        intent: sampleIntent,
      }),
      { type: "navigationSettled" },
    );

    expect(settled.session).toBe("idle");
    expect(settled.navigationIntent).toBeNull();
  });

  it("user gesture replaces an open navigating session", () => {
    const userGesture = reduceMapAnchor(
      reduceMapAnchor(createInitialMapAnchorState(), {
        type: "navigationStarted",
        intent: sampleIntent,
      }),
      { type: "userGestureStarted" },
    );

    expect(userGesture.session).toBe("userGesture");
    expect(userGesture.navigationIntent).toBeNull();
  });
});
