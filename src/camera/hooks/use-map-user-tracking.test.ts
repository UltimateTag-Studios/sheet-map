import { renderHook } from "@testing-library/react";
import { act, createElement, StrictMode, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { mockCanvas, stubViewport } from "../../viewport/testing/fixtures";
import { mountSheetHostFixture } from "../../viewport/testing/mount-sheet-host-fixture";
import {
  createTestMapRef,
  type TestMapRefHarness,
} from "../testing/create-test-map-ref";
import { flushDeferredMapInstanceRelease } from "../testing/flush-deferred-map-instance-release";
import type { MapUserLocationCoords } from "./use-map-user-tracking";
import { useMapUserTracking } from "./use-map-user-tracking";

type UserTrackingHookResult = ReturnType<typeof useMapUserTracking>;

function settleNavigation(
  map: TestMapRefHarness["map"],
  position?: { lat: number; lng: number; zoom?: number },
) {
  if (position) {
    map.setCenter({ lat: position.lat, lng: position.lng });
    if (position.zoom !== undefined) {
      map.setZoom(position.zoom);
    }
  }

  act(() => {
    map.emit("moveend");
  });
}

function mountUserTrackingWithMapRef(
  harness: TestMapRefHarness,
  options: {
    userLocation?: MapUserLocationCoords | null;
    liveSheetObscuredBottomPx?: number;
    smoothFlyDurationMs?: number;
    onMapInstanceReleased?: () => void;
  } = {},
) {
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  const latestRef: { current: UserTrackingHookResult | null } = {
    current: null,
  };

  act(() => {
    root.render(
      createElement(
        StrictMode,
        null,
        createElement(() => {
          latestRef.current = useMapUserTracking({
            mapRef: harness.mapRef,
            userLocation: options.userLocation ?? null,
            liveSheetObscuredBottomPx: options.liveSheetObscuredBottomPx,
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
    get latest(): UserTrackingHookResult {
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

function mountUserTrackingWithLiveSheetPadding(
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

  const mounted = mountUserTrackingWithMapRef(harness, {
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

function startFollowingUser(
  latest: UserTrackingHookResult,
  map: TestMapRefHarness["map"],
  location: MapUserLocationCoords,
  zoom = 15,
) {
  act(() => {
    latest.recenterOnUser({ zoom });
  });
  settleNavigation(map, { ...location, zoom });
}

describe("useMapUserTracking", () => {
  const userLocation: MapUserLocationCoords = {
    lat: 40.7,
    lng: -74,
  };

  it("does not fly on mount when user location is present", () => {
    const harness = mountUserTrackingWithLiveSheetPadding(userLocation);

    expect(harness.latest.tracking).toBe(false);
    expect(harness.latest.boot).not.toBe("done");
    expect(harness.map.flyTo).not.toHaveBeenCalled();

    harness.unmount();
  });

  it("does not fly when userLocation stays null", () => {
    const harness = mountUserTrackingWithLiveSheetPadding(null);

    expect(harness.latest.tracking).toBe(false);
    expect(harness.map.flyTo).not.toHaveBeenCalled();

    harness.unmount();
  });

  it("recenterOnUser flies to the user and enables tracking", () => {
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

    const { result } = renderHook(() =>
      useMapUserTracking({
        mapRef: harness.mapRef,
        userLocation,
        liveSheetObscuredBottomPx: 152,
      }),
    );

    act(() => {
      result.current.recenterOnUser();
    });

    expect(result.current.tracking).toBe(true);
    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);
    expect(harness.map.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [userLocation.lng, userLocation.lat],
      }),
    );
    expect(harness.map.flyTo.mock.calls[0]?.[0]).not.toHaveProperty("zoom");

    fixture.remove();
  });

  it("recenterOnUser accepts an explicit zoom", () => {
    const harness = mountUserTrackingWithLiveSheetPadding(userLocation);

    act(() => {
      harness.latest.recenterOnUser({ zoom: 12 });
    });

    expect(harness.map.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [userLocation.lng, userLocation.lat],
        zoom: 12,
      }),
    );

    harness.unmount();
  });

  it("does not re-issue fly when userLocation coordinates update before recenter", () => {
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
    const latestRef: { current: UserTrackingHookResult | null } = {
      current: null,
    };
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
            latestRef.current = useMapUserTracking({
              mapRef: harness.mapRef,
              userLocation: coords,
              liveSheetObscuredBottomPx: 152,
            });
            return null;
          }),
        ),
      );
    });

    expect(harness.map.flyTo).not.toHaveBeenCalled();

    act(() => {
      setCoords?.({
        lat: userLocation.lat + 0.001,
        lng: userLocation.lng + 0.001,
      });
    });

    expect(harness.map.flyTo).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
    fixture.remove();
  });

  it("repositions via jumpTo when GPS updates while idle and following", () => {
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
    const latestRef: { current: UserTrackingHookResult | null } = {
      current: null,
    };
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
            latestRef.current = useMapUserTracking({
              mapRef: harness.mapRef,
              userLocation: coords,
              liveSheetObscuredBottomPx: 152,
            });
            return null;
          }),
        ),
      );
    });

    if (!latestRef.current) {
      throw new Error("hook not mounted");
    }

    startFollowingUser(latestRef.current, harness.map, userLocation);

    vi.mocked(harness.map.jumpTo).mockClear();

    act(() => {
      setCoords?.({
        lat: userLocation.lat + 0.001,
        lng: userLocation.lng + 0.001,
      });
    });

    expect(harness.map.jumpTo).toHaveBeenCalledTimes(1);
    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
    fixture.remove();
  });

  it("does not navigate via GPS while session is flying", () => {
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
    const latestRef: { current: UserTrackingHookResult | null } = {
      current: null,
    };
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
            latestRef.current = useMapUserTracking({
              mapRef: harness.mapRef,
              userLocation: coords,
              liveSheetObscuredBottomPx: 152,
            });
            return null;
          }),
        ),
      );
    });

    act(() => {
      latestRef.current?.navigateTo(
        { lat: 1, lng: 2, zoom: 12 },
        { duration: 500 },
      );
    });

    expect(latestRef.current?.session).toBe("flying");
    vi.mocked(harness.map.jumpTo).mockClear();

    act(() => {
      setCoords?.({
        lat: userLocation.lat + 0.001,
        lng: userLocation.lng + 0.001,
      });
    });

    expect(harness.map.jumpTo).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
    fixture.remove();
  });

  it("does not follow before recenter and tracks after recenter", () => {
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

    const { result } = renderHook(() =>
      useMapUserTracking({
        mapRef: harness.mapRef,
        userLocation,
        liveSheetObscuredBottomPx: 152,
      }),
    );

    expect(result.current.tracking).toBe(false);

    startFollowingUser(result.current, harness.map, userLocation);

    expect(result.current.tracking).toBe(true);

    fixture.remove();
  });

  it("navigateTo away from user releases tracking", () => {
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

    const { result } = renderHook(
      () =>
        useMapUserTracking({
          mapRef: harness.mapRef,
          userLocation,
          liveSheetObscuredBottomPx: 152,
        }),
      {
        wrapper: ({ children }) => createElement(StrictMode, null, children),
      },
    );

    act(() => {
      result.current.recenterOnUser({ zoom: 15 });
    });
    settleNavigation(harness.map, { ...userLocation, zoom: 15 });

    expect(result.current.tracking).toBe(true);

    act(() => {
      result.current.navigateTo(
        { lat: 37.28, lng: -113.05, zoom: 13 },
        { duration: 1200 },
      );
    });

    expect(harness.map.flyTo).toHaveBeenCalledTimes(2);
    expect(result.current.tracking).toBe(false);

    fixture.remove();
  });
});
