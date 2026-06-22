import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { mockCanvas, stubViewport } from "../viewport/testing/fixtures";
import { mountSheetHostFixture } from "../viewport/testing/mount-sheet-host-fixture";
import {
  hasBootFlownForMapInstance,
  markBootFlownForMapInstance,
} from "./map-instance-camera-state";
import type { MapPosition } from "./map-position";
import { clearMapPaddingSyncState, syncMapPadding } from "./sync-map-padding";
import {
  asTestMapboxMap,
  createTestMapRef,
  type TestMapRefHarness,
} from "./testing/create-test-map-ref";
import type { MapAnchorBootConfig } from "./try-boot-fly";
import { useMapAnchor } from "./use-map-anchor";

type MapAnchorHookResult = ReturnType<typeof useMapAnchor>;

function mountAnchorWithMapRef(
  harness: TestMapRefHarness,
  options: {
    liveSheetObscuredBottomPx?: number;
    sheetPhase?: "idle" | "dragging" | "settling";
    boot?: MapAnchorBootConfig | null;
    smoothFlyDurationMs?: number;
  } = {},
) {
  const { mapRef, map } = harness;
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  const latestRef: { current: MapAnchorHookResult | null } = { current: null };

  act(() => {
    root.render(
      createElement(() => {
        latestRef.current = useMapAnchor({
          mapRef,
          liveSheetObscuredBottomPx: options.liveSheetObscuredBottomPx,
          sheetPhase: options.sheetPhase,
          boot: options.boot,
          smoothFlyDurationMs: options.smoothFlyDurationMs,
        });
        return null;
      }),
    );
  });

  return {
    mapRef,
    map,
    get latest(): MapAnchorHookResult {
      if (!latestRef.current) {
        throw new Error("hook not mounted");
      }
      return latestRef.current;
    },
    unmount() {
      act(() => {
        root.unmount();
      });
    },
  };
}

function mountAnchor(
  options: {
    liveSheetObscuredBottomPx?: number;
    sheetPhase?: "idle" | "dragging" | "settling";
    styleLoaded?: boolean;
  } = {},
) {
  return mountAnchorWithMapRef(
    createTestMapRef({ styleLoaded: options.styleLoaded }),
    options,
  );
}

function mountAnchorWithLiveSheetPadding(
  initialPx = 152,
  options: {
    boot?: MapAnchorBootConfig | null;
    smoothFlyDurationMs?: number;
    styleLoaded?: boolean;
  } = {},
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
    styleLoaded: options.styleLoaded,
    initialPadding: { top: 0, left: 0, right: 0, bottom: 0 },
  });
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  const latestRef: { current: MapAnchorHookResult | null } = { current: null };
  let setLivePx: ((next: number) => void) | null = null;
  let setSheetPhase: ((next: "idle" | "dragging" | "settling") => void) | null =
    null;

  const updateSheetSlideRect = (obscuredBottomPx: number) => {
    fixture.sheetSlide.getBoundingClientRect = () =>
      ({
        top: 800 - obscuredBottomPx,
        bottom: 800,
        left: 0,
        right: 400,
        width: 400,
        height: obscuredBottomPx,
        x: 0,
        y: 800 - obscuredBottomPx,
        toJSON: () => ({}),
      }) as DOMRect;
  };

  act(() => {
    root.render(
      createElement(function Harness() {
        const [liveSheetObscuredBottomPx, setLiveSheetObscuredBottomPx] =
          useState(initialPx);
        const [sheetPhase, setSheetPhaseState] = useState<
          "idle" | "dragging" | "settling"
        >("idle");
        setLivePx = setLiveSheetObscuredBottomPx;
        setSheetPhase = setSheetPhaseState;
        latestRef.current = useMapAnchor({
          mapRef: harness.mapRef,
          liveSheetObscuredBottomPx,
          sheetPhase,
          boot: options.boot,
          smoothFlyDurationMs: options.smoothFlyDurationMs,
        });
        return null;
      }),
    );
  });

  return {
    ...harness,
    get latest(): MapAnchorHookResult {
      if (!latestRef.current) {
        throw new Error("hook not mounted");
      }
      return latestRef.current;
    },
    setObscuredBottomPx(nextPx: number) {
      updateSheetSlideRect(nextPx);
      setLivePx?.(nextPx);
    },
    setSheetPhase(next: "idle" | "dragging" | "settling") {
      setSheetPhase?.(next);
    },
    unmount() {
      act(() => {
        root.unmount();
      });
      fixture.remove();
    },
  };
}

function mountAnchorWithDeferredBootTarget(initialPx = 152) {
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
  const latestRef: { current: MapAnchorHookResult | null } = { current: null };
  let setBootTarget: ((next: MapPosition | null) => void) | null = null;

  act(() => {
    root.render(
      createElement(function Harness() {
        const [bootTarget, setBootTargetState] = useState<MapPosition | null>(
          null,
        );
        setBootTarget = setBootTargetState;
        latestRef.current = useMapAnchor({
          mapRef: harness.mapRef,
          liveSheetObscuredBottomPx: initialPx,
          boot: {
            enabled: true,
            getTarget: () => bootTarget,
          },
        });
        return null;
      }),
    );
  });

  return {
    ...harness,
    get latest(): MapAnchorHookResult {
      if (!latestRef.current) {
        throw new Error("hook not mounted");
      }
      return latestRef.current;
    },
    setBootTarget(next: MapPosition | null) {
      act(() => {
        setBootTarget?.(next);
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

describe("useMapAnchor", () => {
  it("boots anchor from the map center when enabled", () => {
    const harness = mountAnchor();

    expect(harness.latest.anchor).toEqual({ lat: 10, lng: 20, zoom: 14 });
    expect(harness.latest.session).toBe("idle");

    harness.unmount();
  });

  it("skips moveend commits while the map is still moving", () => {
    const harness = mountAnchorWithMapRef(createTestMapRef({ isMoving: true }));

    act(() => {
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
      harness.map.emit("moveend");
    });

    expect(harness.latest.session).toBe("userGesture");
    expect(harness.latest.anchor).toEqual({ lat: 10, lng: 20, zoom: 14 });

    harness.unmount();
  });

  it("commits after moveend when the map has settled", () => {
    const harness = mountAnchorWithMapRef(
      createTestMapRef({ isMoving: false }),
    );

    act(() => {
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
      harness.map.setMoving(true);
      harness.map.emit("moveend");
    });

    expect(harness.latest.session).toBe("userGesture");

    act(() => {
      harness.map.setMoving(false);
      harness.map.setCenter({ lat: 11, lng: 21 });
      harness.map.setZoom(15);
      harness.map.emit("moveend");
    });

    expect(harness.latest.anchor).toEqual({ lat: 11, lng: 21, zoom: 15 });
    expect(harness.latest.session).toBe("idle");

    harness.unmount();
  });

  it("ignores dragstart without a user originalEvent", () => {
    const harness = mountAnchor();

    act(() => {
      harness.map.emit("dragstart");
      harness.map.setMoving(false);
      harness.map.emit("moveend");
    });

    expect(harness.latest.session).toBe("idle");

    harness.unmount();
  });

  it("ignores padding-only moveend during a user gesture", () => {
    const harness = mountAnchor();

    act(() => {
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
    });

    expect(harness.latest.session).toBe("userGesture");

    act(() => {
      syncMapPadding(asTestMapboxMap(harness.map), {
        top: 0,
        left: 0,
        right: 0,
        bottom: 200,
      });
    });

    expect(harness.latest.session).toBe("userGesture");
    expect(harness.latest.anchor).toEqual({ lat: 10, lng: 20, zoom: 14 });

    clearMapPaddingSyncState(asTestMapboxMap(harness.map));
    harness.unmount();
  });

  it("navigateTo sets anchor, opens navigating session, and flies", () => {
    const harness = mountAnchor();
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 500 });
    });

    expect(harness.latest.anchor).toEqual(destination);
    expect(harness.latest.session).toBe("navigating");
    expect(harness.map.flyTo).toHaveBeenCalledWith({
      center: [4, 3],
      zoom: 16,
      padding: { top: 0, left: 0, right: 0, bottom: 152 },
      duration: 500,
    });

    harness.unmount();
  });

  it("navigateTo stops inertial map motion before flying", () => {
    const harness = mountAnchorWithMapRef(createTestMapRef({ isMoving: true }));

    act(() => {
      harness.latest.navigateTo(
        { lat: 3, lng: 4, zoom: 16 },
        { duration: 500 },
      );
    });

    expect(harness.map.stop).toHaveBeenCalledTimes(1);
    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);

    harness.unmount();
  });

  it("navigateTo without duration jumps and omits zoom when not in position", () => {
    const harness = mountAnchor();
    const destination = { lat: 3, lng: 4 };

    act(() => {
      harness.latest.navigateTo(destination);
    });

    expect(harness.latest.session).toBe("navigating");
    expect(harness.map.jumpTo).toHaveBeenCalledWith({
      center: [4, 3],
      padding: { top: 0, left: 0, right: 0, bottom: 152 },
    });

    harness.unmount();
  });

  it("settles navigating session on moveend when at target", () => {
    const harness = mountAnchorWithMapRef(
      createTestMapRef({
        center: { lat: 3, lng: 4 },
        zoom: 16,
      }),
    );
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination);
    });

    vi.mocked(harness.map.jumpTo).mockClear();

    act(() => {
      harness.map.emit("moveend");
    });

    expect(harness.map.jumpTo).not.toHaveBeenCalled();
    expect(harness.latest.session).toBe("idle");

    harness.unmount();
  });

  it("waits on navigating moveend while the map is still moving", () => {
    const harness = mountAnchorWithMapRef(createTestMapRef({ isMoving: true }));

    act(() => {
      harness.latest.navigateTo(
        { lat: 3, lng: 4, zoom: 16 },
        { duration: 1000 },
      );
    });

    act(() => {
      harness.map.emit("moveend");
    });

    expect(harness.latest.session).toBe("navigating");

    harness.unmount();
  });

  it("navigateTo jumps when sheet is dragging", () => {
    const harness = mountAnchor({ sheetPhase: "dragging" });
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 1000 });
    });

    expect(harness.latest.session).toBe("navigating");
    expect(harness.map.flyTo).not.toHaveBeenCalled();
    expect(harness.map.jumpTo).toHaveBeenCalled();

    harness.unmount();
  });

  it("navigateTo jumps while sheet is settling", () => {
    const harness = mountAnchor({ sheetPhase: "settling" });
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 1000 });
    });

    expect(harness.map.jumpTo).toHaveBeenCalled();
    expect(harness.map.flyTo).not.toHaveBeenCalled();

    harness.unmount();
  });

  it("jumps to anchor when map padding changes during navigation", () => {
    const harness = mountAnchorWithLiveSheetPadding(152);
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 1000 });
    });

    vi.mocked(harness.map.jumpTo).mockClear();

    act(() => {
      harness.setSheetPhase("dragging");
      harness.setObscuredBottomPx(200);
    });

    expect(harness.latest.session).toBe("navigating");
    expect(harness.map.jumpTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [destination.lng, destination.lat],
        zoom: destination.zoom,
      }),
    );

    harness.unmount();
  });

  it("user pan during navigating cancels fly and opens userGesture", () => {
    const harness = mountAnchor();

    act(() => {
      harness.latest.navigateTo({ lat: 3, lng: 4 }, { duration: 1000 });
    });

    act(() => {
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
    });

    expect(harness.latest.session).toBe("userGesture");
    expect(harness.latest.navigationIntent).toBeNull();

    harness.unmount();
  });

  it("issues one boot fly after map padding is ready", () => {
    const onIssued = vi.fn();
    const target = { lat: 40, lng: -74, zoom: 12 };
    const harness = mountAnchorWithLiveSheetPadding(152, {
      boot: {
        enabled: true,
        getTarget: () => target,
        onIssued,
        durationMs: 500,
      },
    });

    expect(harness.latest.mapPaddingReady).toBe(true);
    expect(harness.latest.session).toBe("navigating");
    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);
    expect(harness.map.flyTo).toHaveBeenCalledWith({
      center: [-74, 40],
      zoom: 12,
      padding: { top: 0, left: 0, right: 0, bottom: 152 },
      duration: 500,
    });
    expect(onIssued).toHaveBeenCalledTimes(1);
    expect(hasBootFlownForMapInstance(asTestMapboxMap(harness.map))).toBe(true);

    harness.unmount();
  });

  it("skips boot fly when the latch is already set", () => {
    const harness = createTestMapRef();
    markBootFlownForMapInstance(asTestMapboxMap(harness.map));

    const mounted = mountAnchorWithMapRef(harness, {
      boot: {
        enabled: true,
        getTarget: () => ({ lat: 40, lng: -74, zoom: 12 }),
      },
    });

    expect(mounted.map.flyTo).not.toHaveBeenCalled();
    mounted.unmount();
  });

  it("skips boot fly when getTarget returns null", () => {
    const harness = mountAnchorWithLiveSheetPadding(152, {
      boot: {
        enabled: true,
        getTarget: () => null,
      },
    });

    expect(harness.latest.mapPaddingReady).toBe(true);
    expect(harness.map.flyTo).not.toHaveBeenCalled();
    expect(hasBootFlownForMapInstance(asTestMapboxMap(harness.map))).toBe(
      false,
    );

    harness.unmount();
  });

  describe("boot fly hardening", () => {
    it("waits for map style load before boot fly", () => {
      const target = { lat: 40, lng: -74, zoom: 12 };
      const harness = mountAnchorWithLiveSheetPadding(152, {
        styleLoaded: false,
        boot: {
          enabled: true,
          getTarget: () => target,
        },
      });

      expect(harness.latest.mapPaddingReady).toBe(false);
      expect(harness.map.flyTo).not.toHaveBeenCalled();

      act(() => {
        harness.map.emitLoad();
      });

      expect(harness.latest.mapPaddingReady).toBe(true);
      expect(harness.map.flyTo).toHaveBeenCalledTimes(1);
      expect(hasBootFlownForMapInstance(asTestMapboxMap(harness.map))).toBe(
        true,
      );

      harness.unmount();
    });

    it("boots when getTarget becomes available after padding is ready", () => {
      const target = { lat: 40, lng: -74, zoom: 12 };
      const harness = mountAnchorWithDeferredBootTarget(152);

      expect(harness.latest.mapPaddingReady).toBe(true);
      expect(harness.map.flyTo).not.toHaveBeenCalled();

      act(() => {
        harness.setBootTarget(target);
      });

      expect(harness.map.flyTo).toHaveBeenCalledTimes(1);
      expect(harness.map.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          center: [target.lng, target.lat],
          zoom: target.zoom,
        }),
      );
      expect(hasBootFlownForMapInstance(asTestMapboxMap(harness.map))).toBe(
        true,
      );

      harness.unmount();
    });

    it("does not boot fly twice on the same map instance", () => {
      const target = { lat: 40, lng: -74, zoom: 12 };
      const harness = mountAnchorWithLiveSheetPadding(152, {
        boot: {
          enabled: true,
          getTarget: () => target,
        },
      });

      expect(harness.map.flyTo).toHaveBeenCalledTimes(1);

      act(() => {
        harness.setObscuredBottomPx(200);
      });

      expect(harness.map.flyTo).toHaveBeenCalledTimes(1);

      harness.unmount();
    });

    it("can boot again after unmount releases the map instance latch", () => {
      const target = { lat: 40, lng: -74, zoom: 12 };
      const harness = createTestMapRef();
      const boot = {
        enabled: true,
        getTarget: () => target,
      };

      const first = mountAnchorWithMapRef(harness, { boot });
      expect(first.map.flyTo).toHaveBeenCalledTimes(1);
      first.unmount();

      const second = mountAnchorWithMapRef(harness, { boot });
      expect(second.map.flyTo).toHaveBeenCalledTimes(2);

      second.unmount();
    });

    it("navigateTo after boot does not re-issue boot fly", () => {
      const target = { lat: 40, lng: -74, zoom: 12 };
      const harness = mountAnchorWithLiveSheetPadding(152, {
        boot: {
          enabled: true,
          getTarget: () => target,
        },
      });

      vi.mocked(harness.map.flyTo).mockClear();

      act(() => {
        harness.latest.navigateTo(
          { lat: 1, lng: 2, zoom: 10 },
          { duration: 500 },
        );
      });

      expect(harness.map.flyTo).toHaveBeenCalledTimes(1);
      expect(hasBootFlownForMapInstance(asTestMapboxMap(harness.map))).toBe(
        true,
      );

      harness.unmount();
    });
  });
});
