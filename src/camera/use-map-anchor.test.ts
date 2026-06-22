import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import { mockCanvas, stubViewport } from "../viewport/testing/fixtures";
import { mountSheetHostFixture } from "../viewport/testing/mount-sheet-host-fixture";
import {
  hasBootFlownForMapInstance,
  markBootFlownForMapInstance,
} from "./instance/camera-state";
import { clearMapPaddingSyncState, syncMapPadding } from "./padding/sync";
import {
  asTestMapboxMap,
  createTestMapRef,
} from "./testing/create-test-map-ref";
import {
  mountAnchor,
  mountAnchorWithDeferredBootTarget,
  mountAnchorWithLiveSheetPadding,
  mountAnchorWithMapRef,
} from "./testing/mount-map-anchor-harness";

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
      harness.map.setMoving(true);
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

  it("boots during userGesture without waiting for gesture settle", () => {
    const target = { lat: 40, lng: -74, zoom: 12 };
    const harness = mountAnchorWithDeferredBootTarget(152);

    act(() => {
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
      harness.map.setMoving(true);
    });

    act(() => {
      harness.setBootTarget(target);
    });

    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);
    expect(harness.map.stop).toHaveBeenCalledTimes(1);
    expect(harness.latest.session).toBe("navigating");
    expect(hasBootFlownForMapInstance(asTestMapboxMap(harness.map))).toBe(true);

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
    const onBootIssued = vi.fn();
    const target = { lat: 40, lng: -74, zoom: 12 };
    const harness = mountAnchorWithLiveSheetPadding(152, {
      bootTarget: target,
      bootDurationMs: 500,
      onBootIssued,
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
    expect(onBootIssued).toHaveBeenCalledTimes(1);
    expect(hasBootFlownForMapInstance(asTestMapboxMap(harness.map))).toBe(true);

    harness.unmount();
  });

  it("skips boot fly when the latch is already set", () => {
    const harness = createTestMapRef();
    markBootFlownForMapInstance(asTestMapboxMap(harness.map));

    const mounted = mountAnchorWithMapRef(harness, {
      bootTarget: { lat: 40, lng: -74, zoom: 12 },
    });

    expect(mounted.map.flyTo).not.toHaveBeenCalled();
    mounted.unmount();
  });

  it("skips boot fly when boot target is null", () => {
    const harness = mountAnchorWithLiveSheetPadding(152, {
      bootTarget: null,
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
        bootTarget: target,
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

    it("boots when boot target becomes available after padding is ready", () => {
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
        bootTarget: target,
      });

      expect(harness.map.flyTo).toHaveBeenCalledTimes(1);

      act(() => {
        harness.setObscuredBottomPx(200);
      });

      expect(harness.map.flyTo).toHaveBeenCalledTimes(1);

      harness.unmount();
    });

    it("boots via padding sync when boot target was already set", () => {
      stubViewport();
      const initialPx = 152;
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
        styleLoaded: false,
        initialPadding: { top: 0, left: 0, right: 0, bottom: 0 },
      });

      const target = { lat: 40, lng: -74, zoom: 12 };
      const mounted = mountAnchorWithMapRef(harness, {
        bootTarget: target,
        liveSheetObscuredBottomPx: initialPx,
      });

      expect(mounted.latest.mapPaddingReady).toBe(false);
      expect(mounted.map.flyTo).not.toHaveBeenCalled();

      act(() => {
        mounted.map.emitLoad();
      });

      expect(mounted.latest.mapPaddingReady).toBe(true);
      expect(mounted.map.flyTo).toHaveBeenCalledTimes(1);
      expect(hasBootFlownForMapInstance(asTestMapboxMap(mounted.map))).toBe(
        true,
      );

      mounted.unmount();
      fixture.remove();
    });

    it("can boot again after unmount releases the map instance latch", async () => {
      const harness = createTestMapRef();
      const bootTarget = { lat: 40, lng: -74, zoom: 12 };

      const first = mountAnchorWithMapRef(harness, { bootTarget });
      expect(first.map.flyTo).toHaveBeenCalledTimes(1);
      await first.unmount();

      const second = mountAnchorWithMapRef(harness, { bootTarget });
      expect(second.map.flyTo).toHaveBeenCalledTimes(2);

      await second.unmount();
    });

    it("navigateTo after boot does not re-issue boot fly", () => {
      const target = { lat: 40, lng: -74, zoom: 12 };
      const harness = mountAnchorWithLiveSheetPadding(152, {
        bootTarget: target,
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
