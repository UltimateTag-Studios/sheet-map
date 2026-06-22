import { act, createElement, StrictMode, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { mockCanvas, stubViewport } from "../viewport/testing/fixtures";
import { mountSheetHostFixture } from "../viewport/testing/mount-sheet-host-fixture";
import {
  createTestMapRef,
  type TestMapRefHarness,
} from "./testing/create-test-map-ref";
import { flushDeferredMapInstanceRelease } from "./testing/flush-deferred-map-instance-release";
import type { MapUserLocationCoords } from "./use-map-follow-user";
import { useMapFollowUser } from "./use-map-follow-user";

type FollowHookResult = ReturnType<typeof useMapFollowUser>;

function mountFollowUserWithMapRef(
  harness: TestMapRefHarness,
  options: {
    userLocation?: MapUserLocationCoords | null;
    liveSheetObscuredBottomPx?: number;
    followZoom?: number;
    smoothFlyDurationMs?: number;
    onMapInstanceReleased?: () => void;
  } = {},
) {
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  const latestRef: { current: FollowHookResult | null } = { current: null };

  act(() => {
    root.render(
      createElement(
        StrictMode,
        null,
        createElement(() => {
          latestRef.current = useMapFollowUser({
            mapRef: harness.mapRef,
            userLocation: options.userLocation ?? null,
            liveSheetObscuredBottomPx: options.liveSheetObscuredBottomPx,
            followZoom: options.followZoom,
            smoothFlyDurationMs: options.smoothFlyDurationMs,
            onMapInstanceReleased: options.onMapInstanceReleased,
          });
          return null;
        }),
      ),
    );
  });

  return {
    ...harness,
    get latest(): FollowHookResult {
      if (!latestRef.current) {
        throw new Error("hook not mounted");
      }
      return latestRef.current;
    },
    async unmount() {
      act(() => {
        root.unmount();
      });
      await flushDeferredMapInstanceRelease();
    },
  };
}

function mountFollowUserWithLiveSheetPadding(
  userLocation: MapUserLocationCoords | null,
  initialPx = 152,
) {
  stubViewport();
  const fixture = mountSheetHostFixture(
    mockCanvas,
    {},
    {
      top: 800 - initialPx,
      bottom: 800,
      height: initialPx,
      y: 800 - initialPx,
    },
  );

  const harness = createTestMapRef({
    canvas: fixture.canvas,
    initialPadding: { top: 0, left: 0, right: 0, bottom: 0 },
  });

  const mounted = mountFollowUserWithMapRef(harness, {
    userLocation,
    liveSheetObscuredBottomPx: initialPx,
  });

  return {
    ...mounted,
    unmount() {
      mounted.unmount();
      fixture.remove();
    },
  };
}

function mountFollowUserWithDeferredLocation(initialPx = 152) {
  stubViewport();
  const fixture = mountSheetHostFixture(
    mockCanvas,
    {},
    {
      top: 800 - initialPx,
      bottom: 800,
      height: initialPx,
      y: 800 - initialPx,
    },
  );

  const harness = createTestMapRef({
    canvas: fixture.canvas,
    initialPadding: { top: 0, left: 0, right: 0, bottom: 0 },
  });

  const container = document.createElement("div");
  const root: Root = createRoot(container);
  const latestRef: { current: FollowHookResult | null } = { current: null };
  let setUserLocation: ((next: MapUserLocationCoords | null) => void) | null =
    null;

  act(() => {
    root.render(
      createElement(function Harness() {
        const [userLocation, setUserLocationState] =
          useState<MapUserLocationCoords | null>(null);
        setUserLocation = setUserLocationState;
        latestRef.current = useMapFollowUser({
          mapRef: harness.mapRef,
          userLocation,
          liveSheetObscuredBottomPx: initialPx,
        });
        return null;
      }),
    );
  });

  return {
    ...harness,
    get latest(): FollowHookResult {
      if (!latestRef.current) {
        throw new Error("hook not mounted");
      }
      return latestRef.current;
    },
    setUserLocation(next: MapUserLocationCoords | null) {
      act(() => {
        setUserLocation?.(next);
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
      fixture.remove();
    },
  };
}

describe("useMapFollowUser", () => {
  const userLocation: MapUserLocationCoords = {
    lat: 40.7,
    lng: -74,
  };

  it("boots once when userLocation is present and padding is ready", () => {
    const harness = mountFollowUserWithLiveSheetPadding(userLocation);

    expect(harness.latest.followUser).toBe(true);
    expect(harness.latest.hasBootFlown).toBe(true);
    expect(harness.latest.mapPaddingReady).toBe(true);
    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);
    expect(harness.map.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [userLocation.lng, userLocation.lat],
        zoom: 15,
      }),
    );

    harness.unmount();
  });

  it("boots when userLocation arrives after padding is ready", () => {
    const harness = mountFollowUserWithDeferredLocation();

    expect(harness.latest.followUser).toBe(false);
    expect(harness.map.flyTo).not.toHaveBeenCalled();

    harness.setUserLocation(userLocation);

    expect(harness.latest.followUser).toBe(true);
    expect(harness.latest.hasBootFlown).toBe(true);
    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);

    harness.unmount();
  });

  it("boots when padding becomes ready after userLocation is already set", () => {
    stubViewport();
    const fixture = mountSheetHostFixture(
      mockCanvas,
      {},
      {
        top: 800 - 152,
        bottom: 800,
        height: 152,
        y: 800 - 152,
      },
    );

    const harness = createTestMapRef({
      canvas: fixture.canvas,
      styleLoaded: false,
      initialPadding: { top: 0, left: 0, right: 0, bottom: 0 },
    });

    const mounted = mountFollowUserWithMapRef(harness, {
      userLocation,
      liveSheetObscuredBottomPx: 152,
    });

    expect(mounted.latest.mapPaddingReady).toBe(false);
    expect(mounted.map.flyTo).not.toHaveBeenCalled();

    act(() => {
      mounted.map.emitLoad();
    });

    expect(mounted.latest.mapPaddingReady).toBe(true);
    expect(mounted.latest.hasBootFlown).toBe(true);
    expect(mounted.map.flyTo).toHaveBeenCalledTimes(1);

    mounted.unmount();
    fixture.remove();
  });

  it("boots when padding becomes ready without map idle or moveend", () => {
    stubViewport();
    const fixture = mountSheetHostFixture(
      mockCanvas,
      {},
      {
        top: 800 - 152,
        bottom: 800,
        height: 152,
        y: 800 - 152,
      },
    );

    const harness = createTestMapRef({
      canvas: fixture.canvas,
      emitEventsOnSetPadding: false,
      initialPadding: { top: 0, left: 0, right: 0, bottom: 0 },
    });

    const mounted = mountFollowUserWithMapRef(harness, {
      userLocation,
      liveSheetObscuredBottomPx: 152,
    });

    expect(mounted.latest.mapPaddingReady).toBe(true);
    expect(mounted.latest.hasBootFlown).toBe(true);
    expect(mounted.map.flyTo).toHaveBeenCalledTimes(1);

    mounted.unmount();
    fixture.remove();
  });

  it("does not boot when userLocation stays null", () => {
    const harness = mountFollowUserWithLiveSheetPadding(null);

    expect(harness.latest.followUser).toBe(false);
    expect(harness.latest.hasBootFlown).toBe(false);
    expect(harness.latest.mapPaddingReady).toBe(true);
    expect(harness.map.flyTo).not.toHaveBeenCalled();

    harness.unmount();
  });

  it("can boot again after map instance release", async () => {
    const onMapInstanceReleased = vi.fn();
    const harness = createTestMapRef();
    const first = mountFollowUserWithMapRef(harness, {
      userLocation,
      onMapInstanceReleased,
    });

    expect(first.latest.hasBootFlown).toBe(true);
    expect(first.map.flyTo).toHaveBeenCalledTimes(1);
    await first.unmount();
    expect(onMapInstanceReleased).toHaveBeenCalledTimes(1);

    const second = mountFollowUserWithMapRef(harness, { userLocation });
    expect(second.map.flyTo).toHaveBeenCalledTimes(2);
    expect(second.latest.hasBootFlown).toBe(true);

    await second.unmount();
  });

  it("does not re-issue boot when userLocation coordinates update", () => {
    stubViewport();
    const fixture = mountSheetHostFixture(
      mockCanvas,
      {},
      {
        top: 800 - 152,
        bottom: 800,
        height: 152,
        y: 800 - 152,
      },
    );

    const harness = createTestMapRef({
      canvas: fixture.canvas,
      initialPadding: { top: 0, left: 0, right: 0, bottom: 0 },
    });

    const container = document.createElement("div");
    const root: Root = createRoot(container);
    const latestRef: { current: FollowHookResult | null } = { current: null };
    let setCoords: ((next: MapUserLocationCoords) => void) | null = null;

    act(() => {
      root.render(
        createElement(
          StrictMode,
          null,
          createElement(function Harness() {
            const [coords, setCoordsState] =
              useState<MapUserLocationCoords>(userLocation);
            setCoords = setCoordsState;
            latestRef.current = useMapFollowUser({
              mapRef: harness.mapRef,
              userLocation: coords,
              liveSheetObscuredBottomPx: 152,
            });
            return null;
          }),
        ),
      );
    });

    expect(latestRef.current?.hasBootFlown).toBe(true);
    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);

    act(() => {
      setCoords?.({
        lat: userLocation.lat + 0.001,
        lng: userLocation.lng + 0.001,
      });
    });

    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
    fixture.remove();
  });
});
