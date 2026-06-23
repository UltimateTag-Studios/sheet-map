import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MapPosition } from "../camera/shared/map-position";
import { createMapInstanceStore } from "./map-instance-store";
import { useMapShell } from "./use-map-shell";

const navigateToMock = vi.fn();
const recenterOnUserMock = vi.fn();

vi.mock("../viewport", () => ({
  useLiveSheetObscuredBottomPx: () => ({
    sheetObscuredBottomPx: 0,
    sheetPhase: "idle" as const,
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
    navigateTo: navigateToMock,
    recenterOnUser: recenterOnUserMock,
  }),
}));

describe("useMapShell", () => {
  beforeEach(() => {
    navigateToMock.mockClear();
    recenterOnUserMock.mockClear();
  });

  it("tracks sheet snap and selection via reducer", () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
        userLocation: null,
      }),
    );

    expect(result.current.sheetSnap).toBe("collapsed");
    expect(result.current.selectedItemId).toBeNull();

    act(() => {
      result.current.selectItem("a", { lat: 1, lng: 2 });
    });

    expect(result.current.selectedItemId).toBe("a");
    expect(result.current.sheetSnap).toBe("half");
    expect(navigateToMock).toHaveBeenCalledWith(
      { lat: 1, lng: 2 },
      { duration: 600, keepTracking: false },
    );

    act(() => {
      result.current.handleSheetSnapSettled("collapsed");
    });

    expect(result.current.selectedItemId).toBeNull();
  });

  it("selectItem without location skips navigateTo", () => {
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

    expect(result.current.selectedItemId).toBe("a");

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

    act(() => {
      result.current.handleSheetSnapChange("collapsed");
    });

    expect(result.current.sheetSnap).toBe("collapsed");
    expect(result.current.selectedItemId).toBe("a");

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
