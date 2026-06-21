import { describe, expect, it } from "vitest";

import { reduceMapAnchor } from "./reduce-map-anchor";
import { createInitialMapAnchorState } from "./state";

const samplePosition = { lat: 1, lng: 2, zoom: 15 };

describe("reduceMapAnchor", () => {
  it("stores an explicit anchor without changing session", () => {
    const next = reduceMapAnchor(createInitialMapAnchorState(), {
      type: "setAnchor",
      position: samplePosition,
    });

    expect(next.anchor).toEqual(samplePosition);
    expect(next.session).toBe("idle");
  });

  it("opens a user gesture session", () => {
    const started = reduceMapAnchor(createInitialMapAnchorState(), {
      type: "userGestureStarted",
    });

    expect(started.session).toBe("userGesture");
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

  it("opens a programmatic navigation session", () => {
    const navigating = reduceMapAnchor(
      reduceMapAnchor(createInitialMapAnchorState(), {
        type: "setAnchor",
        position: samplePosition,
      }),
      { type: "navigationStarted" },
    );

    expect(navigating.anchor).toEqual(samplePosition);
    expect(navigating.session).toBe("programmatic");
  });

  it("closes programmatic session on settle", () => {
    const settled = reduceMapAnchor(
      reduceMapAnchor(createInitialMapAnchorState(), {
        type: "navigationStarted",
      }),
      { type: "programmaticSettled" },
    );

    expect(settled.session).toBe("idle");
  });

  it("user gesture replaces an open programmatic session", () => {
    const userGesture = reduceMapAnchor(
      reduceMapAnchor(createInitialMapAnchorState(), {
        type: "navigationStarted",
      }),
      { type: "userGestureStarted" },
    );

    expect(userGesture.session).toBe("userGesture");
  });
});
