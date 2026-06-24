import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MapAnchorSession } from "../camera";
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

const dispatchMock = vi.fn();

vi.mock("../camera", () => ({
  useMapUserTracking: () => ({
    tracking: false,
    mapPaddingReady: true,
    boot: "done",
    hasUserLocation: true,
    anchor: null,
    get session() {
      return mockCameraSession;
    },
    readCameraSession: () => mockCameraSession,
    navigateTo: navigateToMock,
    recenterOnUser: recenterOnUserMock,
    dispatch: dispatchMock,
  }),
}));

describe("useMapShell", () => {
  beforeEach(() => {
    navigateToMock.mockClear();
    recenterOnUserMock.mockClear();
    dispatchMock.mockClear();
    mockSheetPhase = "idle";
    mockCameraSession = "idle";
    navigateToMock.mockReturnValue(true);
  });

  it("flies first and opens half after camera settles", async () => {
    dispatchMock.mockImplementation(() => {
      mockCameraSession = "flying";
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
    expect(dispatchMock).toHaveBeenCalledWith({
      type: "navigateRequested",
      position: { lat: 1, lng: 2 },
      mode: "fly",
      preserveTracking: false,
      durationMs: 600,
    });

    mockCameraSession = "flying";
    await act(async () => {
      rerender();
    });

    mockCameraSession = "idle";
    await act(async () => {
      rerender();
    });
    expect(result.current.sheetSnap).toBe("half");
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
      result.current.handleSheetSnapSettled("half");
      result.current.handleSheetLayoutFrameChange({
        visibleHeightPx: 300,
        phase: "idle",
        restingSnap: "half",
      });
    });

    dispatchMock.mockClear();

    await act(async () => {
      result.current.selectItem("b", { lat: 3, lng: 4 });
    });

    expect(result.current.selectedItemId).toBe("b");
    expect(result.current.sheetSnap).toBe("half");
    expect(dispatchMock).toHaveBeenCalledWith({
      type: "navigateRequested",
      position: { lat: 3, lng: 4 },
      mode: "fly",
      preserveTracking: false,
      durationMs: 600,
    });
  });

  it("recenterUser routes through shell and does not change sheetSnap", async () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
      }),
    );

    await act(async () => {
      result.current.handleSheetSnapSettled("full");
      result.current.handleSheetLayoutFrameChange({
        visibleHeightPx: 600,
        phase: "idle",
        restingSnap: "full",
      });
    });

    recenterOnUserMock.mockClear();

    await act(async () => {
      result.current.recenterUser();
    });

    expect(result.current.sheetSnap).toBe("full");
    expect(result.current.selectedItemId).toBeNull();
    expect(recenterOnUserMock).toHaveBeenCalled();
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
      result.current.handleSheetLayoutFrameChange({
        visibleHeightPx: 200,
        phase: "dragging",
        restingSnap: "collapsed",
      });
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

  it("keeps selection on navigateTo with preserveTracking", async () => {
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
      result.current.navigateTo(position, { preserveTracking: true });
    });

    expect(result.current.selectedItemId).toBe("a");
    expect(navigateToMock).toHaveBeenCalledWith(position, {
      preserveTracking: true,
    });
  });
});
