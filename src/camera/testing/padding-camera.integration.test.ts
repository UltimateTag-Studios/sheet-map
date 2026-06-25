import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import { mountCameraWithLiveSheetPadding } from "./mount-map-camera-harness";

describe("padding + camera integration", () => {
  it("updates padding without changing anchor or session when idle", () => {
    const harness = mountCameraWithLiveSheetPadding(152);
    const bootAnchor = harness.latest.anchor;

    expect(bootAnchor).toEqual({ lat: 10, lng: 20, zoom: 14 });
    expect(harness.latest.session).toBe("idle");
    expect(harness.latest.mapPaddingReady).toBe(true);
    expect(harness.map.setPadding).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      right: 0,
      bottom: 152,
    });

    vi.mocked(harness.map.setPadding).mockClear();

    harness.setObscuredBottomPx(200);

    expect(harness.map.setPadding).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      right: 0,
      bottom: 200,
    });
    expect(harness.latest.anchor).toEqual(bootAnchor);
    expect(harness.latest.session).toBe("idle");
    expect(harness.map.jumpTo).not.toHaveBeenCalled();

    harness.unmount();
  });

  it("keeps user session open when padding moveend fires during momentum", () => {
    const harness = mountCameraWithLiveSheetPadding(152);
    const bootAnchor = harness.latest.anchor;

    act(() => {
      harness.map.setMoving(true);
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
    });

    expect(harness.latest.session).toBe("userGesture");

    harness.setObscuredBottomPx(200);

    expect(harness.latest.session).toBe("userGesture");
    expect(harness.latest.anchor).toEqual(bootAnchor);

    act(() => {
      harness.map.setMoving(false);
      harness.map.setCenter({ lat: 11, lng: 21 });
      harness.map.setZoom(15);
      harness.map.emit("moveend");
    });

    expect(harness.latest.session).toBe("idle");
    expect(harness.latest.anchor).toEqual({ lat: 11, lng: 21, zoom: 15 });
    expect(harness.map.jumpTo).not.toHaveBeenCalled();

    harness.unmount();
  });

  it("applies padding live during userGesture without jumpTo", () => {
    const harness = mountCameraWithLiveSheetPadding(152);

    act(() => {
      harness.map.setMoving(true);
      harness.map.emit("dragstart", {
        originalEvent: new Event("pointerdown"),
      });
    });

    vi.mocked(harness.map.setPadding).mockClear();

    harness.setSheetPhase("dragging");
    harness.setObscuredBottomPx(350);

    expect(harness.map.setPadding).toHaveBeenCalledWith(
      expect.objectContaining({ bottom: 350 }),
    );
    expect(harness.map.jumpTo).not.toHaveBeenCalled();

    harness.unmount();
  });

  it("jumps to nav target when padding changes during navigation and sheet moves (I11)", () => {
    const harness = mountCameraWithLiveSheetPadding(152);
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 1000 });
    });

    expect(harness.latest.session).toBe("flying");

    vi.mocked(harness.map.flyTo).mockClear();
    vi.mocked(harness.map.jumpTo).mockClear();

    harness.setSheetPhase("dragging");
    harness.setObscuredBottomPx(200);

    expect(harness.map.flyTo).not.toHaveBeenCalled();
    expect(harness.map.jumpTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [destination.lng, destination.lat],
        zoom: destination.zoom,
      }),
    );
    expect(harness.latest.session).toBe("flying");
    expect(harness.latest.anchor).toEqual(destination);

    harness.unmount();
  });

  it("defers padding apply while flying and sheet idle at rest", () => {
    const harness = mountCameraWithLiveSheetPadding(152);
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 1000 });
    });

    vi.mocked(harness.map.setPadding).mockClear();
    vi.mocked(harness.map.jumpTo).mockClear();

    harness.setObscuredBottomPx(200);

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
      bottom: 200,
    });
    expect(harness.map.jumpTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [destination.lng, destination.lat],
        zoom: destination.zoom,
      }),
    );
    expect(harness.latest.session).toBe("idle");

    harness.unmount();
  });

  it("settles flying session on fly moveend", () => {
    const harness = mountCameraWithLiveSheetPadding(152);
    const destination = { lat: 3, lng: 4, zoom: 16 };

    act(() => {
      harness.latest.navigateTo(destination, { duration: 1000 });
    });

    vi.mocked(harness.map.flyTo).mockClear();

    act(() => {
      harness.map.setCenter({ lat: destination.lat, lng: destination.lng });
      harness.map.setZoom(destination.zoom);
      harness.map.emit("moveend");
    });

    expect(harness.map.flyTo).not.toHaveBeenCalled();
    expect(harness.map.jumpTo).not.toHaveBeenCalled();
    expect(harness.latest.session).toBe("idle");

    harness.unmount();
  });
});
