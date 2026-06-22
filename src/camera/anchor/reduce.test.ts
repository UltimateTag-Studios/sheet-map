import { describe, expect, it } from "vitest";

import { reduceMapAnchor } from "./reduce";
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
    const started = reduceMapAnchor(
      reduceMapAnchor(createInitialMapAnchorState(), {
        type: "flyStarted",
      }),
      { type: "userGestureStarted" },
    );

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

  it("opens a flying session", () => {
    const flying = reduceMapAnchor(
      reduceMapAnchor(createInitialMapAnchorState(), {
        type: "setAnchor",
        position: samplePosition,
      }),
      { type: "flyStarted" },
    );

    expect(flying.anchor).toEqual(samplePosition);
    expect(flying.session).toBe("flying");
  });

  it("closes flying session on settle", () => {
    const settled = reduceMapAnchor(
      reduceMapAnchor(createInitialMapAnchorState(), {
        type: "flyStarted",
      }),
      { type: "flySettled" },
    );

    expect(settled.session).toBe("idle");
  });

  it("user gesture replaces an open flying session", () => {
    const userGesture = reduceMapAnchor(
      reduceMapAnchor(createInitialMapAnchorState(), {
        type: "flyStarted",
      }),
      { type: "userGestureStarted" },
    );

    expect(userGesture.session).toBe("userGesture");
  });
});
