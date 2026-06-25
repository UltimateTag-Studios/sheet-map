import { describe, expect, it } from "vitest";

import { reduceMapCameraMachine } from "./reduce";
import {
  createInitialMapCameraMachineState,
  type MapCameraState,
} from "./state";
import { productEffects } from "./test-helpers/product-effects";

const samplePosition = { lat: 1, lng: 2, zoom: 15 };
const samplePadding = { top: 0, left: 0, right: 0, bottom: 120 };

function baseState(overrides: Partial<MapCameraState> = {}): MapCameraState {
  return {
    ...createInitialMapCameraMachineState(),
    ...overrides,
  };
}

describe("reduceMapCameraMachine", () => {
  it("stores anchor on mapStyleReady without changing session", () => {
    const result = reduceMapCameraMachine(
      createInitialMapCameraMachineState(),
      {
        type: "mapStyleReady",
        position: samplePosition,
      },
    );

    expect(result.state.anchor).toEqual(samplePosition);
    expect(result.state.session).toBe("idle");
    expect(result.effects).toEqual([]);
  });

  it("opens a user gesture session", () => {
    const state = baseState({
      session: "flying",
    });

    const result = reduceMapCameraMachine(state, { type: "mapGestureBegan" });

    expect(result.state.session).toBe("userGesture");
    expect(result.state.followThresholdExceeded).toBe(false);
  });

  it("commits anchor and closes session on user gesture settle", () => {
    const state = baseState({ session: "userGesture" });

    const result = reduceMapCameraMachine(state, {
      type: "mapMoveEnd",
      paddingMoveEnd: false,
      isMoving: false,
      position: samplePosition,
      atAnchor: true,
    });

    expect(result.state.anchor).toEqual(samplePosition);
    expect(result.state.session).toBe("idle");
  });

  it("opens a flying session on navigate fly", () => {
    const state = baseState({
      padding: {
        phase: "ready",
        options: samplePadding,
        suppressNextMoveEnd: false,
        pendingApply: null,
      },
    });

    const result = reduceMapCameraMachine(state, {
      type: "navigateRequested",
      position: samplePosition,
      mode: "fly",
      preserveTracking: false,
    });

    expect(result.state.anchor).toEqual(samplePosition);
    expect(result.state.session).toBe("flying");
    expect(result.state.tracking).toBe("off");
    expect(productEffects(result.effects)).toEqual([
      { type: "releaseTracking" },
      { type: "applyPadding", options: samplePadding, realign: false },
      { type: "moveCamera", position: samplePosition, duration: 600 },
    ]);
  });

  it("closes flying session on settle", () => {
    const state = baseState({
      session: "flying",
      anchor: samplePosition,
    });

    const result = reduceMapCameraMachine(state, {
      type: "mapMoveEnd",
      paddingMoveEnd: false,
      isMoving: false,
      position: samplePosition,
      atAnchor: true,
    });

    expect(result.state.session).toBe("idle");
  });

  it("does not settle flying while sheet is moving", () => {
    const state = baseState({
      session: "flying",
      anchor: samplePosition,
      sheetPhase: "dragging",
    });

    const result = reduceMapCameraMachine(state, {
      type: "mapMoveEnd",
      paddingMoveEnd: false,
      isMoving: false,
      position: samplePosition,
      atAnchor: true,
    });

    expect(result.state.session).toBe("flying");
  });

  it("jumps when sheet is not idle even if fly was requested", () => {
    const state = baseState({
      session: "flying",
      sheetPhase: "dragging",
    });

    const result = reduceMapCameraMachine(state, {
      type: "navigateRequested",
      position: samplePosition,
      mode: "fly",
      preserveTracking: true,
    });

    expect(result.state.session).toBe("idle");
    expect(productEffects(result.effects)).toEqual([
      { type: "moveCamera", position: samplePosition, duration: 0 },
    ]);
  });

  it("starts and stops tracking", () => {
    const follow = {
      userLocation: { lat: 1, lng: 2 },
      centerOffset: { x: 0, y: 0 },
      thresholdPx: 40,
    };

    const started = reduceMapCameraMachine(
      createInitialMapCameraMachineState(),
      {
        type: "startTracking",
        follow,
      },
    );
    expect(started.state.tracking).toBe("on");
    expect(started.state.follow).toEqual(follow);

    const stopped = reduceMapCameraMachine(started.state, {
      type: "stopTracking",
    });
    expect(stopped.state.tracking).toBe("off");
    expect(stopped.effects).toEqual([{ type: "releaseTracking" }]);
  });

  it("releases tracking when follow threshold is exceeded", () => {
    const state = baseState({
      tracking: "on",
      session: "userGesture",
      follow: {
        userLocation: { lat: 1, lng: 2 },
        centerOffset: { x: 0, y: 0 },
        thresholdPx: 40,
      },
    });

    const result = reduceMapCameraMachine(state, {
      type: "mapFollowThresholdExceeded",
    });

    expect(result.state.tracking).toBe("off");
    expect(result.effects).toEqual([{ type: "releaseTracking" }]);
  });

  it("snaps back to user on gesture settle within threshold", () => {
    const state = baseState({
      tracking: "on",
      session: "userGesture",
      follow: {
        userLocation: { lat: 3, lng: 4 },
        centerOffset: { x: 0, y: 0 },
        thresholdPx: 40,
      },
    });

    const result = reduceMapCameraMachine(state, {
      type: "gestureSettleResolved",
      outcome: {
        kind: "snapBackToUser",
        target: { lat: 3, lng: 4 },
      },
    });

    expect(result.state.session).toBe("flying");
    expect(result.state.anchor).toEqual({ lat: 3, lng: 4 });
    expect(productEffects(result.effects)).toEqual([
      { type: "moveCamera", position: { lat: 3, lng: 4 }, duration: 600 },
    ]);
  });

  it("defers padding apply while flying and sheet idle at rest", () => {
    const nextPadding = { ...samplePadding, bottom: 200 };
    const state = baseState({
      session: "flying",
      sheetPhase: "idle",
      anchor: samplePosition,
      padding: {
        phase: "ready",
        options: samplePadding,
        suppressNextMoveEnd: false,
        pendingApply: null,
      },
    });

    const result = reduceMapCameraMachine(state, {
      type: "paddingMeasured",
      options: nextPadding,
      changed: true,
    });

    expect(result.state.padding.pendingApply).toEqual(nextPadding);
    expect(productEffects(result.effects)).toEqual([]);
  });

  it("realigns to anchor when padding changes during fly and sheet moves", () => {
    const nextPadding = { ...samplePadding, bottom: 200 };
    const state = baseState({
      session: "flying",
      sheetPhase: "settling",
      anchor: samplePosition,
      padding: {
        phase: "ready",
        options: samplePadding,
        suppressNextMoveEnd: false,
        pendingApply: null,
      },
    });

    const result = reduceMapCameraMachine(state, {
      type: "paddingMeasured",
      options: nextPadding,
      changed: true,
    });

    expect(productEffects(result.effects)).toEqual([
      { type: "applyPadding", options: nextPadding, realign: true },
    ]);
  });

  it("ignores duplicate paddingMeasured when padding is already ready", () => {
    const state = baseState({
      session: "idle",
      sheetPhase: "idle",
      padding: {
        phase: "ready",
        options: samplePadding,
        suppressNextMoveEnd: false,
        pendingApply: null,
      },
    });

    const result = reduceMapCameraMachine(state, {
      type: "paddingMeasured",
      options: samplePadding,
      changed: false,
    });

    expect(result.state).toEqual(state);
    expect(result.effects).toEqual([]);
  });

  it("flushes deferred padding when flying settles", () => {
    const pendingPadding = { ...samplePadding, bottom: 200 };
    const state = baseState({
      session: "flying",
      sheetPhase: "idle",
      anchor: samplePosition,
      padding: {
        phase: "ready",
        options: samplePadding,
        suppressNextMoveEnd: false,
        pendingApply: pendingPadding,
      },
    });

    const result = reduceMapCameraMachine(state, {
      type: "mapMoveEnd",
      paddingMoveEnd: false,
      isMoving: false,
      position: samplePosition,
      atAnchor: true,
    });

    expect(result.state.session).toBe("idle");
    expect(result.state.padding.pendingApply).toBeNull();
    expect(productEffects(result.effects)).toEqual([
      { type: "applyPadding", options: pendingPadding, realign: true },
    ]);
  });

  it("does not notify shell when padding applies during sheet settling", () => {
    const nextPadding = { ...samplePadding, bottom: 200 };
    const state = baseState({
      session: "idle",
      sheetPhase: "settling",
      anchor: samplePosition,
      padding: {
        phase: "ready",
        options: samplePadding,
        suppressNextMoveEnd: false,
        pendingApply: null,
      },
    });

    const result = reduceMapCameraMachine(state, {
      type: "paddingMeasured",
      options: nextPadding,
      changed: true,
    });

    expect(
      result.effects.some(
        (effect) =>
          effect.type === "notifyShell" &&
          effect.signal.kind === "paddingApplied",
      ),
    ).toBe(false);
    expect(productEffects(result.effects)).toEqual([
      { type: "applyPadding", options: nextPadding, realign: true },
    ]);
  });

  it("does not realign padding changes during userGesture", () => {
    const nextPadding = { ...samplePadding, bottom: 200 };
    const state = baseState({
      session: "userGesture",
      sheetPhase: "settling",
      anchor: samplePosition,
      padding: {
        phase: "ready",
        options: samplePadding,
        suppressNextMoveEnd: false,
        pendingApply: null,
      },
    });

    const result = reduceMapCameraMachine(state, {
      type: "paddingMeasured",
      options: nextPadding,
      changed: true,
    });

    expect(productEffects(result.effects)).toEqual([
      { type: "applyPadding", options: nextPadding, realign: false },
    ]);
  });

  it("issues boot fly when padding becomes ready", () => {
    const follow = {
      userLocation: { lat: 1, lng: 2 },
      centerOffset: { x: 0, y: 0 },
      thresholdPx: 40,
    };
    const state = baseState({
      boot: "pending",
      bootTarget: samplePosition,
      bootFollow: follow,
      bootPositionKey: "2:1:15",
      padding: {
        phase: "pending",
        options: null,
        suppressNextMoveEnd: false,
        pendingApply: null,
      },
    });

    const result = reduceMapCameraMachine(state, {
      type: "paddingMeasured",
      options: samplePadding,
      changed: true,
    });

    expect(result.state.boot).toBe("done");
    expect(result.state.tracking).toBe("on");
    expect(result.state.follow).toEqual(follow);
    expect(result.state.lastAppliedGpsKey).toBe("2:1:15");
    expect(result.state.session).toBe("flying");
    expect(productEffects(result.effects)).toEqual([
      { type: "applyPadding", options: samplePadding, realign: false },
      { type: "applyPadding", options: samplePadding, realign: false },
      { type: "moveCamera", position: samplePosition, duration: 600 },
    ]);
  });

  it("applies gps fix as jump while tracking and idle", () => {
    const state = baseState({
      tracking: "on",
      session: "idle",
    });

    const nextPosition = { lat: 5, lng: 6 };
    const result = reduceMapCameraMachine(state, {
      type: "gpsFix",
      position: nextPosition,
      positionKey: "6:5:preserve",
    });

    expect(result.state.lastAppliedGpsKey).toBe("6:5:preserve");
    expect(productEffects(result.effects)).toEqual([
      { type: "moveCamera", position: nextPosition, duration: 0 },
    ]);
  });

  it("skips duplicate gps fixes", () => {
    const state = baseState({
      tracking: "on",
      session: "idle",
      lastAppliedGpsKey: "6:5:preserve",
    });

    const result = reduceMapCameraMachine(state, {
      type: "gpsFix",
      position: { lat: 5, lng: 6 },
      positionKey: "6:5:preserve",
    });

    expect(result.effects).toEqual([]);
  });

  it("resets state and bumps mapGeneration on instance release", () => {
    const state = baseState({
      mapGeneration: 2,
      session: "flying",
      anchor: samplePosition,
      boot: "done",
    });

    const result = reduceMapCameraMachine(state, {
      type: "mapInstanceReleased",
    });

    expect(result.state.mapGeneration).toBe(3);
    expect(result.state.session).toBe("idle");
    expect(result.state.anchor).toBeNull();
    expect(result.state.boot).toBe("none");
  });

  it("clears padding suppress flag on padding moveend", () => {
    const state = baseState({
      session: "idle",
      padding: {
        phase: "ready",
        options: samplePadding,
        suppressNextMoveEnd: true,
        pendingApply: null,
      },
    });

    const result = reduceMapCameraMachine(state, {
      type: "mapMoveEnd",
      paddingMoveEnd: true,
      isMoving: false,
      position: samplePosition,
      atAnchor: true,
    });

    expect(result.state.padding.suppressNextMoveEnd).toBe(false);
    expect(result.state.session).toBe("idle");
  });

  it("clears stale padding suppress when listeners attach late", () => {
    const state = baseState({
      padding: {
        phase: "ready",
        options: samplePadding,
        suppressNextMoveEnd: true,
        pendingApply: null,
      },
    });

    const result = reduceMapCameraMachine(state, {
      type: "paddingSuppressDrained",
    });

    expect(result.state.padding.suppressNextMoveEnd).toBe(false);
  });
});
