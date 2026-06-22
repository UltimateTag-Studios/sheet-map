import { describe, expect, it } from "vitest";

import { resolveMoveEnd } from "./resolve-move-end";

const position = { lat: 10, lng: 20, zoom: 14 };
const readPosition = () => position;

describe("resolveMoveEnd", () => {
  it("ignores padding-only moveend while the map is still moving", () => {
    expect(
      resolveMoveEnd({
        paddingMoveEnd: true,
        isMoving: true,
        session: "userGesture",
        readPosition,
      }),
    ).toEqual({ kind: "noop", reason: "padding_only" });
  });

  it("settles userGesture after padding moveend when the map stopped", () => {
    expect(
      resolveMoveEnd({
        paddingMoveEnd: true,
        isMoving: false,
        session: "userGesture",
        readPosition,
      }),
    ).toEqual({ kind: "userGestureSettled", position });
  });

  it("settles userGesture on a normal moveend when idle momentum finished", () => {
    expect(
      resolveMoveEnd({
        paddingMoveEnd: false,
        isMoving: false,
        session: "userGesture",
        readPosition,
      }),
    ).toEqual({ kind: "userGestureSettled", position });
  });

  it("waits while momentum is still active", () => {
    expect(
      resolveMoveEnd({
        paddingMoveEnd: false,
        isMoving: true,
        session: "userGesture",
        readPosition,
      }),
    ).toEqual({ kind: "noop", reason: "still_moving" });
  });

  it("signals navigating settle when session is navigating and map stopped", () => {
    expect(
      resolveMoveEnd({
        paddingMoveEnd: false,
        isMoving: false,
        session: "navigating",
        readPosition,
      }),
    ).toEqual({ kind: "trySettleNavigating" });
  });
});
