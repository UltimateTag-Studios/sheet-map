import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { MapRef } from "react-map-gl/mapbox";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MapViewportSyncState } from "../canvas/viewport/use-map-viewport-sync";
import { createMapInstanceStore } from "./map-instance-store";
import { useMapShell } from "./use-map-shell";

const emptyViewport: MapViewportSyncState = {
  clientRect: null,
  centerOffset: { x: 0, y: 0 },
  hasVisibleArea: false,
};

vi.mock("../canvas/viewport/use-map-viewport-sync", () => ({
  useMapViewportSync: vi.fn(() => emptyViewport),
}));

vi.mock("../camera/use-map-user-location-follow", () => ({
  useMapUserLocationFollow: vi.fn(),
}));

function createMapRef(): MapRef {
  return {
    getMap: () => ({}),
  } as MapRef;
}

function mountMapShell() {
  const mapInstanceStore = createMapInstanceStore();
  let shell: ReturnType<typeof useMapShell> | null = null;

  function Harness() {
    shell = useMapShell({
      mapInstanceStore,
      accessToken: "test-token",
      userLocation: { lng: 1, lat: 2 },
    });
    return null;
  }

  const container = document.createElement("div");
  const root: Root = createRoot(container);

  act(() => {
    root.render(createElement(Harness));
  });

  return {
    get shell() {
      if (!shell) {
        throw new Error("useMapShell did not run");
      }
      return shell;
    },
    mapInstanceStore,
    unmount() {
      act(() => {
        root.unmount();
      });
    },
  };
}

describe("useMapShell", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("starts collapsed with smooth user camera follow enabled", () => {
    const harness = mountMapShell();

    expect(harness.shell.sheetSnap).toBe("collapsed");
    expect(harness.shell.followUser).toBe(true);
    expect(harness.shell.cameraAnchor).toEqual({
      kind: "user",
      motion: "smooth",
    });

    harness.unmount();
  });

  it("reflects map instances published into the store", () => {
    const harness = mountMapShell();
    const mapRef = createMapRef();

    act(() => {
      harness.shell.publishMapInstance(mapRef);
    });

    expect(harness.shell.mapRef).toBe(mapRef);

    harness.unmount();
  });

  it("selectPoint focuses a point, stops user follow, and opens the sheet", () => {
    const harness = mountMapShell();

    act(() => {
      harness.shell.selectPoint("ABC123", true);
    });

    expect(harness.shell.selectedPointId).toBe("ABC123");
    expect(harness.shell.cameraAnchor).toEqual({
      kind: "point",
      id: "ABC123",
    });
    expect(harness.shell.followUser).toBe(false);
    expect(harness.shell.sheetSnap).toBe("half");

    harness.unmount();
  });

  it("startFollowingUser dismisses point selection and recenters on the user", () => {
    const harness = mountMapShell();

    act(() => {
      harness.shell.selectPoint("ABC123", true);
    });

    const epochBefore = harness.shell.cameraEpoch;

    act(() => {
      harness.shell.startFollowingUser();
    });

    expect(harness.shell.selectedPointId).toBeNull();
    expect(harness.shell.sheetSnap).toBe("collapsed");
    expect(harness.shell.followUser).toBe(true);
    expect(harness.shell.cameraAnchor).toEqual({
      kind: "user",
      motion: "smooth",
    });
    expect(harness.shell.cameraEpoch).toBe(epochBefore + 1);

    harness.unmount();
  });

  it("dismissPointSelection clears a point anchor and collapses the sheet", () => {
    const harness = mountMapShell();

    act(() => {
      harness.shell.selectPoint("ABC123", true);
    });

    act(() => {
      harness.shell.dismissPointSelection();
    });

    expect(harness.shell.selectedPointId).toBeNull();
    expect(harness.shell.cameraAnchor).toBeNull();
    expect(harness.shell.sheetSnap).toBe("collapsed");

    harness.unmount();
  });

  it("resetUserCameraMotion clears one-shot smooth user motion", () => {
    const harness = mountMapShell();

    act(() => {
      harness.shell.startFollowingUser();
    });

    expect(harness.shell.cameraAnchor).toEqual({
      kind: "user",
      motion: "smooth",
    });

    act(() => {
      harness.shell.resetUserCameraMotion();
    });

    expect(harness.shell.cameraAnchor).toEqual({ kind: "user" });

    harness.unmount();
  });
});
