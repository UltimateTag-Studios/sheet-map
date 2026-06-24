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
    readCameraSession: () => mockCameraSession,
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
    navigateToMock.mockReturnValue(true);
  });

  it("flies first and opens half after camera settles", async () => {
    navigateToMock.mockImplementation(() => {
      mockCameraSession = "flying";
      return true;
    });

    const mapInstanceStore = createMapInstanceStore();
    const { result, rerender } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
      }),
    );

    await act(async () => {
      result.current.selectItem("a", { lat: 1, lng: 2 });
      await Promise.resolve();
    });

    expect(result.current.selectedItemId).toBe("a");
    expect(result.current.sheetSnap).toBe("collapsed");
    expect(navigateToMock).toHaveBeenCalledWith(
      { lat: 1, lng: 2 },
      { duration: 600, keepTracking: false },
    );

    mockCameraSession = "idle";
    await act(async () => {
      rerender();
    });
    expect(result.current.sheetSnap).toBe("half");
  });

  it("keeps sheet collapsed until camera reports flying then idle", async () => {
    navigateToMock.mockImplementation(() => {
      mockCameraSession = "flying";
      return true;
    });

    const mapInstanceStore = createMapInstanceStore();
    const { result, rerender } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
      }),
    );

    await act(async () => {
      result.current.selectItem("a", { lat: 1, lng: 2 });
      await Promise.resolve();
    });

    expect(result.current.sheetSnap).toBe("collapsed");

    mockCameraSession = "idle";
    await act(async () => {
      rerender();
    });

    expect(result.current.sheetSnap).toBe("half");
  });

  it("does not open half while camera session stays idle", async () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
      }),
    );

    await act(async () => {
      result.current.selectItem("a", { lat: 1, lng: 2 });
      await Promise.resolve();
    });

    expect(result.current.sheetSnap).toBe("collapsed");
  });

  it("flies immediately when the sheet is already open at half", async () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
      }),
    );

    await act(async () => {
      result.current.handleSheetSnapChange("half");
      result.current.handleSheetSnapSettled("half");
    });

    navigateToMock.mockClear();

    await act(async () => {
      result.current.selectItem("b", { lat: 3, lng: 4 });
    });

    expect(result.current.selectedItemId).toBe("b");
    expect(result.current.sheetSnap).toBe("half");
    expect(navigateToMock).toHaveBeenCalledWith(
      { lat: 3, lng: 4 },
      { duration: 600, keepTracking: false },
    );
  });

  it("clears selection when dragging the sheet closed", async () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result, rerender } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
      }),
    );

    await act(async () => {
      result.current.selectItem("a", { lat: 1, lng: 2 });
      await Promise.resolve();
    });

    await act(async () => {
      mockSheetPhase = "dragging";
      rerender();
    });

    await act(async () => {
      result.current.handleSheetSnapChange("collapsed");
    });

    expect(result.current.selectedItemId).toBe("a");

    await act(async () => {
      result.current.handleSheetSnapSettled("collapsed");
    });

    expect(result.current.sheetSnap).toBe("collapsed");
    expect(result.current.selectedItemId).toBeNull();
  });

  it("closeSheet collapses and clears selection", async () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
      }),
    );

    await act(async () => {
      result.current.selectItem("a", null);
    });

    await act(async () => {
      result.current.closeSheet();
    });

    expect(result.current.sheetSnap).toBe("collapsed");
    expect(result.current.selectedItemId).toBeNull();
  });

  it("keeps selection on navigateTo with keepTracking", async () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
      }),
    );

    await act(async () => {
      result.current.selectItem("a", null);
    });

    const position: MapPosition = { lat: 3, lng: 4, zoom: 12 };

    await act(async () => {
      result.current.navigateTo(position, { keepTracking: true });
    });

    expect(result.current.selectedItemId).toBe("a");
    expect(navigateToMock).toHaveBeenCalledWith(position, {
      keepTracking: true,
    });
  });
});
