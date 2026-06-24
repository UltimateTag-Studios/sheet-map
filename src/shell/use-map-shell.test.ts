import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MapAnchorSession } from "../camera/anchor/state";
import type { MapPosition } from "../camera/shared/map-position";
import type { SheetMotionPhase } from "../viewport";
import { createMapInstanceStore } from "./map-instance-store";
import { useMapShell } from "./use-map-shell";

const navigateToMock = vi.fn();
const recenterOnUserMock = vi.fn();

let mockSheetPhase: SheetMotionPhase = "idle";
let mockCameraSession: MapAnchorSession = "idle";

vi.mock("../viewport", () => ({
  useLiveSheetObscuredBottomPx: () => ({
    sheetObscuredBottomPx: 0,
    get sheetPhase() {
      return mockSheetPhase;
    },
    onSheetLayoutFrameChange: vi.fn(),
  }),
  useMapVisibleViewportSync: () => ({
    clientRect: null,
    centerOffset: { x: 0, y: 0 },
    hasVisibleArea: false,
  }),
}));

vi.mock("../camera", () => ({
  useMapUserTracking: () => ({
    tracking: false,
    mapPaddingReady: true,
    get session() {
      return mockCameraSession;
    },
    navigateTo: navigateToMock,
    recenterOnUser: recenterOnUserMock,
  }),
}));

describe("useMapShell", () => {
  beforeEach(() => {
    navigateToMock.mockClear();
    recenterOnUserMock.mockClear();
    mockSheetPhase = "idle";
    mockCameraSession = "idle";
  });

  it("flies first and keeps sheet collapsed until camera settles", () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result, rerender } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
      }),
    );

    act(() => {
      result.current.selectItem("a", { lat: 1, lng: 2 });
    });

    expect(result.current.selectedItemId).toBe("a");
    expect(result.current.sheetSnap).toBe("collapsed");
    expect(navigateToMock).toHaveBeenCalledWith(
      { lat: 1, lng: 2 },
      { duration: 600, keepTracking: false },
    );

    mockCameraSession = "flying";
    act(() => {
      rerender();
    });
    expect(result.current.sheetSnap).toBe("collapsed");

    mockCameraSession = "idle";
    act(() => {
      rerender();
    });
    expect(result.current.sheetSnap).toBe("half");
  });

  it("flies immediately when the sheet is already open and idle at half", () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
      }),
    );

    act(() => {
      result.current.handleSheetSnapChange("half");
      result.current.handleSheetSnapSettled("half");
    });

    navigateToMock.mockClear();

    act(() => {
      result.current.selectItem("b", { lat: 3, lng: 4 });
    });

    expect(result.current.selectedItemId).toBe("b");
    expect(result.current.sheetSnap).toBe("half");
    expect(navigateToMock).toHaveBeenCalledWith(
      { lat: 3, lng: 4 },
      { duration: 600, keepTracking: false },
    );
  });

  it("selectItem without location opens half without flying", () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
      }),
    );

    act(() => {
      result.current.selectItem("a", null);
    });

    expect(result.current.selectedItemId).toBe("a");
    expect(result.current.sheetSnap).toBe("half");
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it("clears selection when recentering on user", () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
        userLocation: { lat: 10, lng: 20 },
      }),
    );

    act(() => {
      result.current.selectItem("a", null);
    });

    act(() => {
      result.current.recenterOnUser();
    });

    expect(result.current.selectedItemId).toBeNull();
    expect(recenterOnUserMock).toHaveBeenCalledOnce();
  });

  it("clears selection on navigateTo without keepTracking", () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
      }),
    );

    act(() => {
      result.current.selectItem("a", null);
    });

    act(() => {
      result.current.navigateTo({ lat: 3, lng: 4 });
    });

    expect(result.current.selectedItemId).toBeNull();
    expect(navigateToMock).toHaveBeenCalledWith({ lat: 3, lng: 4 }, undefined);
  });

  it("keeps selection on navigateTo with keepTracking", () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
      }),
    );

    act(() => {
      result.current.selectItem("a", null);
    });

    const position: MapPosition = { lat: 3, lng: 4, zoom: 12 };

    act(() => {
      result.current.navigateTo(position, { keepTracking: true });
    });

    expect(result.current.selectedItemId).toBe("a");
    expect(navigateToMock).toHaveBeenCalledWith(position, {
      keepTracking: true,
    });
  });

  it("clears selection when dragging the sheet closed", () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
      }),
    );

    act(() => {
      result.current.selectItem("a", { lat: 1, lng: 2 });
    });

    mockCameraSession = "flying";
    act(() => {
      result.current.handleSheetSnapChange("collapsed");
    });

    mockCameraSession = "idle";
    act(() => {
      result.current.handleSheetSnapSettled("collapsed");
    });

    expect(result.current.sheetSnap).toBe("collapsed");
    expect(result.current.selectedItemId).toBeNull();
  });

  it("closeSheet collapses and clears selection", () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
      }),
    );

    act(() => {
      result.current.selectItem("a", null);
    });

    act(() => {
      result.current.closeSheet();
    });

    expect(result.current.sheetSnap).toBe("collapsed");
    expect(result.current.selectedItemId).toBeNull();
  });
});
