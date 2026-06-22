import { renderHook } from "@testing-library/react";
import { act, createElement, StrictMode, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { mockCanvas, stubViewport } from "../../viewport/testing/fixtures";
import { mountSheetHostFixture } from "../../viewport/testing/mount-sheet-host-fixture";
import { hasBootFlownForMapInstance } from "../instance/camera-state";
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
    bootZoom?: number;
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
            bootZoom: options.bootZoom,
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

function mountUserTrackingWithDeferredLocation(initialPx = 152) {
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
  const latestRef: { current: UserTrackingHookResult | null } = {
    current: null,
  };
  let setUserLocation: ((next: MapUserLocationCoords | null) => void) | null =
    null;

  act(() => {
    root.render(
      createElement(function Harness() {
        const [userLocation, setUserLocationState] =
          useState<MapUserLocationCoords | null>(null);
        setUserLocation = setUserLocationState;
        latestRef.current = useMapUserTracking({
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
    get latest(): UserTrackingHookResult {
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

describe("useMapUserTracking", () => {
  const userLocation: MapUserLocationCoords = {
    lat: 40.7,
    lng: -74,
  };

  it("boots once when userLocation is present and padding is ready", () => {
    const harness = mountUserTrackingWithLiveSheetPadding(userLocation);

    expect(harness.latest.tracking).toBe(true);
    expect(hasBootFlownForMapInstance(harness.mapRef.getMap())).toBe(true);
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
    const harness = mountUserTrackingWithDeferredLocation();

    expect(harness.latest.tracking).toBe(false);
    expect(harness.map.flyTo).not.toHaveBeenCalled();

    harness.setUserLocation(userLocation);

    expect(harness.latest.tracking).toBe(true);
    expect(hasBootFlownForMapInstance(harness.mapRef.getMap())).toBe(true);
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

    const mounted = mountUserTrackingWithMapRef(harness, {
      userLocation,
      liveSheetObscuredBottomPx: 152,
    });

    expect(mounted.latest.mapPaddingReady).toBe(false);
    expect(mounted.map.flyTo).not.toHaveBeenCalled();

    act(() => {
      mounted.map.emitLoad();
    });

    expect(mounted.latest.mapPaddingReady).toBe(true);
    expect(hasBootFlownForMapInstance(mounted.mapRef.getMap())).toBe(true);
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

    const mounted = mountUserTrackingWithMapRef(harness, {
      userLocation,
      liveSheetObscuredBottomPx: 152,
    });

    expect(mounted.latest.mapPaddingReady).toBe(true);
    expect(hasBootFlownForMapInstance(mounted.mapRef.getMap())).toBe(true);
    expect(mounted.map.flyTo).toHaveBeenCalledTimes(1);

    mounted.unmount();
    fixture.remove();
  });

  it("does not boot when userLocation stays null", () => {
    const harness = mountUserTrackingWithLiveSheetPadding(null);

    expect(harness.latest.tracking).toBe(false);
    expect(hasBootFlownForMapInstance(harness.mapRef.getMap())).toBe(false);
    expect(harness.latest.mapPaddingReady).toBe(true);
    expect(harness.map.flyTo).not.toHaveBeenCalled();

    harness.unmount();
  });

  it("can boot again after map instance release", async () => {
    const onMapInstanceReleased = vi.fn();
    const harness = createTestMapRef();
    const first = mountUserTrackingWithMapRef(harness, {
      userLocation,
      onMapInstanceReleased,
    });

    expect(hasBootFlownForMapInstance(first.mapRef.getMap())).toBe(true);
    expect(first.map.flyTo).toHaveBeenCalledTimes(1);
    await first.unmount();
    expect(onMapInstanceReleased).toHaveBeenCalledTimes(1);

    const second = mountUserTrackingWithMapRef(harness, { userLocation });
    expect(second.map.flyTo).toHaveBeenCalledTimes(2);
    expect(hasBootFlownForMapInstance(second.mapRef.getMap())).toBe(true);

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

    expect(hasBootFlownForMapInstance(harness.mapRef.getMap())).toBe(true);
    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);
    settleNavigation(harness.map, { ...userLocation, zoom: 15 });
    expect(latestRef.current?.session).toBe("idle");
    vi.mocked(harness.map.jumpTo).mockClear();

    act(() => {
      setCoords?.({
        lat: userLocation.lat + 0.001,
        lng: userLocation.lng + 0.001,
      });
    });

    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);
    expect(harness.map.jumpTo).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
    fixture.remove();
  });

  it("does not reposition immediately after boot for the same coordinates", () => {
    const harness = mountUserTrackingWithLiveSheetPadding(userLocation);

    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);
    expect(harness.map.jumpTo).not.toHaveBeenCalled();

    harness.unmount();
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
            useMapUserTracking({
              mapRef: harness.mapRef,
              userLocation: coords,
              liveSheetObscuredBottomPx: 152,
            });
            return null;
          }),
        ),
      );
    });

    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);
    settleNavigation(harness.map, { ...userLocation, zoom: 15 });

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

  it("does not follow before boot and tracks after boot", () => {
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

    const mounted = mountUserTrackingWithMapRef(harness, {
      userLocation,
      liveSheetObscuredBottomPx: 152,
    });

    expect(mounted.latest.tracking).toBe(false);
    expect(mounted.latest.tracking).toBe(false);

    act(() => {
      mounted.map.emitLoad();
    });

    expect(mounted.latest.tracking).toBe(true);
    expect(mounted.latest.tracking).toBe(true);

    mounted.unmount();
    fixture.remove();
  });

  it("recenterOnUser flies to the user and enables tracking", () => {
    const harness = mountUserTrackingWithLiveSheetPadding(userLocation);

    vi.mocked(harness.map.flyTo).mockClear();

    act(() => {
      harness.latest.recenterOnUser();
    });

    expect(harness.latest.tracking).toBe(true);
    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);
    expect(harness.map.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [userLocation.lng, userLocation.lat],
      }),
    );
    expect(harness.map.flyTo.mock.calls[0]?.[0]).not.toHaveProperty("zoom");

    harness.unmount();
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
