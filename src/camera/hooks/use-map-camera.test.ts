import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import { mockCanvas, stubViewport } from "../../viewport/testing/fixtures";
import { mountSheetHostFixture } from "../../viewport/testing/mount-sheet-host-fixture";
import { createTestMapRef } from "../testing/create-test-map-ref";
import {
  mountCamera,
  mountCameraWithDeferredBootTarget,
  mountCameraWithLiveSheetPadding,
  mountCameraWithMapRef,
} from "../testing/mount-map-camera-harness";

describe("useMapCamera", () => {
  it("boots anchor from the map center when enabled", () => {
    const harness = mountCamera();

    expect(harness.latest.anchor).toEqual({ lat: 10, lng: 20, zoom: 14 });
    expect(harness.latest.session).toBe("idle");

    harness.unmount();
  });

  it("skips moveend commits while the map is still moving", () => {
    const harness = mountCameraWithMapRef(createTestMapRef({ isMoving: true }));

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
    const harness = mountCameraWithMapRef(
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
    const harness = mountCamera();

    act(() => {
      harness.map.emit("dragstart");
      harness.map.setMoving(false);
      harness.map.emit("moveend");
    });

    expect(harness.latest.session).toBe("idle");

    harness.unmount();
  });

  it("ignores padding-only moveend during a user gesture", () => {
    const harness = mountCamera();

    act(() => {
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
      harness.map.setMoving(true);
    });

    expect(harness.latest.session).toBe("userGesture");

    act(() => {
      harness.latest.dispatch({
        type: "paddingMeasured",
        options: { top: 0, left: 0, right: 0, bottom: 200 },
        changed: true,
      });
    });

    expect(harness.latest.session).toBe("userGesture");
    expect(harness.latest.anchor).toEqual({ lat: 10, lng: 20, zoom: 14 });

    harness.unmount();
  });

  it("boots during userGesture without waiting for gesture settle", () => {
    const target = { lat: 40, lng: -74, zoom: 12 };
    const harness = mountCameraWithDeferredBootTarget(152);

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
    expect(harness.latest.session).toBe("flying");
    expect(harness.latest.boot).toBe("done");

    harness.unmount();
  });

  it("navigateTo sets anchor, opens flying session, and flies", () => {
    const harness = mountCamera();
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 500 });
    });

    expect(harness.latest.anchor).toEqual(destination);
    expect(harness.latest.session).toBe("flying");
    expect(harness.map.flyTo).toHaveBeenCalledWith({
      center: [4, 3],
      zoom: 16,
      padding: { top: 0, left: 0, right: 0, bottom: 152 },
      duration: 500,
    });

    harness.unmount();
  });

  it("navigateTo without preserveTracking calls onReleaseTracking", () => {
    const onReleaseTracking = vi.fn();
    const harness = mountCamera({ onReleaseTracking });

    act(() => {
      harness.latest.navigateTo({ lat: 3, lng: 4 }, { duration: 500 });
    });

    expect(onReleaseTracking).toHaveBeenCalledTimes(1);

    harness.unmount();
  });

  it("navigateTo with duration 0 jumps and stays idle", () => {
    const harness = mountCamera();

    act(() => {
      harness.latest.navigateTo({ lat: 3, lng: 4, zoom: 16 });
    });

    expect(harness.latest.session).toBe("idle");
    expect(harness.map.jumpTo).toHaveBeenCalled();
    expect(harness.map.stop).toHaveBeenCalled();
    expect(harness.map.flyTo).not.toHaveBeenCalled();

    harness.unmount();
  });

  it("navigateTo stops inertial map motion before flying", () => {
    const harness = mountCameraWithMapRef(createTestMapRef({ isMoving: true }));

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
    const harness = mountCamera();
    const destination = { lat: 3, lng: 4 };

    act(() => {
      harness.latest.navigateTo(destination);
    });

    expect(harness.latest.session).toBe("idle");
    expect(harness.map.jumpTo).toHaveBeenCalledWith({
      center: [4, 3],
      padding: { top: 0, left: 0, right: 0, bottom: 152 },
    });

    harness.unmount();
  });

  it("settles flying session on moveend when at target", () => {
    const harness = mountCameraWithMapRef(
      createTestMapRef({
        center: { lat: 3, lng: 4 },
        zoom: 16,
      }),
    );
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 1000 });
    });

    vi.mocked(harness.map.jumpTo).mockClear();

    act(() => {
      harness.map.emit("moveend");
    });

    expect(harness.map.jumpTo).not.toHaveBeenCalled();
    expect(harness.latest.session).toBe("idle");

    harness.unmount();
  });

  it("settles flying session on padding-flagged moveend when at target", () => {
    const harness = mountCameraWithMapRef(
      createTestMapRef({
        center: { lat: 3, lng: 4 },
        zoom: 16,
      }),
    );
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 1000 });
    });

    expect(harness.latest.session).toBe("flying");

    act(() => {
      harness.latest.dispatch({
        type: "paddingMeasured",
        options: harness.map.getPadding(),
        changed: true,
      });
      harness.map.emit("moveend");
    });

    expect(harness.latest.session).toBe("idle");

    harness.unmount();
  });

  it("navigateTo jump clears a stuck flying session", () => {
    const harness = mountCamera();

    act(() => {
      harness.latest.navigateTo(
        { lat: 3, lng: 4, zoom: 16 },
        { duration: 1000 },
      );
    });

    expect(harness.latest.session).toBe("flying");

    act(() => {
      harness.latest.navigateTo({ lat: 3, lng: 4, zoom: 16 });
    });

    expect(harness.latest.session).toBe("idle");

    harness.unmount();
  });

  it("waits on flying moveend while the map is still moving", () => {
    const harness = mountCameraWithMapRef(createTestMapRef({ isMoving: true }));

    act(() => {
      harness.latest.navigateTo(
        { lat: 3, lng: 4, zoom: 16 },
        { duration: 1000 },
      );
    });

    act(() => {
      harness.map.emit("moveend");
    });

    expect(harness.latest.session).toBe("flying");

    harness.unmount();
  });

  it("navigateTo jumps when sheet is dragging", () => {
    const harness = mountCamera();

    act(() => {
      harness.latest.dispatch({ type: "sheetPhaseChanged", phase: "dragging" });
    });

    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 1000 });
    });

    expect(harness.latest.session).toBe("idle");
    expect(harness.map.flyTo).not.toHaveBeenCalled();
    expect(harness.map.jumpTo).toHaveBeenCalled();

    harness.unmount();
  });

  it("navigateTo jumps while sheet is settling", () => {
    const harness = mountCamera();

    act(() => {
      harness.latest.dispatch({ type: "sheetPhaseChanged", phase: "settling" });
    });

    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 1000 });
    });

    expect(harness.map.jumpTo).toHaveBeenCalled();
    expect(harness.map.flyTo).not.toHaveBeenCalled();

    harness.unmount();
  });

  it("jumps to anchor when map padding changes during navigation and sheet moves", () => {
    const harness = mountCameraWithLiveSheetPadding(152);
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 1000 });
    });

    vi.mocked(harness.map.jumpTo).mockClear();

    act(() => {
      harness.setSheetPhase("dragging");
      harness.setObscuredBottomPx(200);
    });

    expect(harness.latest.session).toBe("flying");
    expect(harness.map.jumpTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [destination.lng, destination.lat],
        zoom: destination.zoom,
      }),
    );

    harness.unmount();
  });

  it("defers padding apply while flying and sheet idle at rest", () => {
    const harness = mountCameraWithLiveSheetPadding(400);
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 1000 });
    });

    vi.mocked(harness.map.setPadding).mockClear();
    vi.mocked(harness.map.jumpTo).mockClear();

    harness.setObscuredBottomPx(450);

    expect(harness.map.setPadding).not.toHaveBeenCalled();
    expect(harness.map.jumpTo).not.toHaveBeenCalled();

    act(() => {
      harness.map.setCenter({ lat: destination.lat, lng: destination.lng });
      harness.map.setZoom(destination.zoom);
      harness.map.emit("moveend");
    });

    expect(harness.map.setPadding).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      right: 0,
      bottom: 450,
    });
    expect(harness.map.jumpTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [destination.lng, destination.lat],
        zoom: destination.zoom,
      }),
    );

    harness.unmount();
  });

  it("user pan during flying cancels fly and opens userGesture", () => {
    const harness = mountCamera();

    act(() => {
      harness.latest.navigateTo({ lat: 3, lng: 4 }, { duration: 1000 });
    });

    act(() => {
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
    });

    expect(harness.latest.session).toBe("userGesture");

    harness.unmount();
  });

  it("issues one boot fly after map padding is ready", () => {
    const target = { lat: 40, lng: -74, zoom: 12 };
    const harness = mountCameraWithLiveSheetPadding(152, {
      bootTarget: target,
      bootDurationMs: 500,
    });

    expect(harness.latest.mapPaddingReady).toBe(true);
    expect(harness.latest.session).toBe("flying");
    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);
    expect(harness.map.flyTo).toHaveBeenCalledWith({
      center: [-74, 40],
      zoom: 12,
      padding: { top: 0, left: 0, right: 0, bottom: 152 },
      duration: 500,
    });
    expect(harness.latest.boot).toBe("done");

    harness.unmount();
  });

  it("skips boot fly when boot already completed", () => {
    const target = { lat: 40, lng: -74, zoom: 12 };
    const harness = mountCameraWithLiveSheetPadding(152, {
      bootTarget: target,
    });

    expect(harness.latest.boot).toBe("done");
    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);

    act(() => {
      harness.setObscuredBottomPx?.(200);
    });

    expect(harness.map.flyTo).toHaveBeenCalledTimes(1);
    harness.unmount();
  });

  it("skips boot fly when boot target is null", () => {
    const harness = mountCameraWithLiveSheetPadding(152, {
      bootTarget: null,
    });

    expect(harness.latest.mapPaddingReady).toBe(true);
    expect(harness.map.flyTo).not.toHaveBeenCalled();
    expect(harness.latest.boot).not.toBe("done");

    harness.unmount();
  });

  describe("boot fly hardening", () => {
    it("waits for map style load before boot fly", () => {
      const target = { lat: 40, lng: -74, zoom: 12 };
      const harness = mountCameraWithLiveSheetPadding(152, {
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
      expect(harness.latest.boot).toBe("done");

      harness.unmount();
    });

    it("boots when boot target becomes available after padding is ready", () => {
      const target = { lat: 40, lng: -74, zoom: 12 };
      const harness = mountCameraWithDeferredBootTarget(152);

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
      expect(harness.latest.boot).toBe("done");

      harness.unmount();
    });

    it("does not boot fly twice on the same map instance", () => {
      const target = { lat: 40, lng: -74, zoom: 12 };
      const harness = mountCameraWithLiveSheetPadding(152, {
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
      const mounted = mountCameraWithMapRef(harness, {
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
      expect(mounted.latest.boot).toBe("done");

      mounted.unmount();
      fixture.remove();
    });

    it("can boot again after unmount releases the map instance latch", async () => {
      const harness = createTestMapRef();
      const bootTarget = { lat: 40, lng: -74, zoom: 12 };

      const first = mountCameraWithMapRef(harness, { bootTarget });
      expect(first.map.flyTo).toHaveBeenCalledTimes(1);
      await first.unmount();

      const second = mountCameraWithMapRef(harness, { bootTarget });
      expect(second.map.flyTo).toHaveBeenCalledTimes(2);

      await second.unmount();
    });

    it("navigateTo after boot does not re-issue boot fly", () => {
      const target = { lat: 40, lng: -74, zoom: 12 };
      const harness = mountCameraWithLiveSheetPadding(152, {
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
      expect(harness.latest.boot).toBe("done");

      harness.unmount();
    });
  });

  describe("follow gesture settle", () => {
    const follow = {
      userLocation: { lat: 2, lng: 1 },
      centerOffset: { x: 20, y: -80 },
      thresholdPx: 40,
    };

    function withProject(
      harness: ReturnType<typeof createTestMapRef>,
      project: () => { x: number; y: number },
    ) {
      const map = harness.map as typeof harness.map & {
        project: () => { x: number; y: number };
      };
      map.project = project;
      return harness;
    }

    it("snaps back via navigateTo when follow is enabled and pan is within threshold", () => {
      const onReleaseTracking = vi.fn();
      const harness = withProject(createTestMapRef(), () => ({
        x: 220,
        y: 320,
      }));
      const mounted = mountCameraWithMapRef(harness, {
        follow,
        onReleaseTracking,
        smoothFlyDurationMs: 600,
      });

      act(() => {
        harness.map.emit("dragstart", {
          originalEvent: new Event("pointerdown"),
        });
      });

      act(() => {
        harness.map.emit("moveend");
      });

      expect(harness.map.flyTo).toHaveBeenCalledTimes(1);
      expect(onReleaseTracking).not.toHaveBeenCalled();
      expect(mounted.latest.session).toBe("flying");

      mounted.unmount();
    });

    it("stops follow when pan exceeds threshold at settle", () => {
      const onReleaseTracking = vi.fn();
      const harness = withProject(createTestMapRef(), () => ({
        x: 300,
        y: 320,
      }));
      const mounted = mountCameraWithMapRef(harness, {
        follow,
        onReleaseTracking,
      });

      act(() => {
        harness.map.emit("dragstart", {
          originalEvent: new Event("pointerdown"),
        });
        harness.map.setCenter({ lat: 11, lng: 21 });
      });

      act(() => {
        harness.map.emit("moveend");
      });

      expect(harness.map.flyTo).not.toHaveBeenCalled();
      expect(onReleaseTracking).toHaveBeenCalledTimes(1);
      expect(mounted.latest.anchor).toEqual({ lat: 11, lng: 21, zoom: 14 });
      expect(mounted.latest.session).toBe("idle");

      mounted.unmount();
    });

    it("snaps back after scroll wheel via wheel event", () => {
      const onReleaseTracking = vi.fn();
      const harness = withProject(createTestMapRef(), () => ({
        x: 220,
        y: 320,
      }));
      const mounted = mountCameraWithMapRef(harness, {
        follow,
        onReleaseTracking,
        smoothFlyDurationMs: 600,
      });

      act(() => {
        harness.map.emit("wheel", {
          originalEvent: new WheelEvent("wheel"),
        });
      });

      act(() => {
        harness.map.emit("moveend");
      });

      expect(harness.map.flyTo).toHaveBeenCalledTimes(1);
      expect(onReleaseTracking).not.toHaveBeenCalled();
      expect(mounted.latest.session).toBe("flying");

      mounted.unmount();
    });

    it("stops follow during drag as soon as threshold is crossed", () => {
      const onReleaseTracking = vi.fn();
      let projected = { x: 220, y: 320 };
      const harness = withProject(createTestMapRef(), () => projected);
      const mounted = mountCameraWithMapRef(harness, {
        follow,
        onReleaseTracking,
      });

      act(() => {
        harness.map.emit("dragstart", {
          originalEvent: new Event("pointerdown"),
        });
      });

      act(() => {
        projected = { x: 300, y: 320 };
        harness.map.emit("move");
      });

      expect(onReleaseTracking).toHaveBeenCalledTimes(1);
      expect(harness.map.flyTo).not.toHaveBeenCalled();

      act(() => {
        projected = { x: 220, y: 320 };
        harness.map.emit("moveend");
      });

      expect(harness.map.flyTo).not.toHaveBeenCalled();

      mounted.unmount();
    });
  });
});
