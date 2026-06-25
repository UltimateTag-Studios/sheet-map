import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CameraShellSignal } from "../camera/shared/camera-shell-signal";
import type { MapPosition } from "../camera/shared/map-position";
import { createMapInstanceStore } from "./map-instance-store";
import { useMapShell } from "./use-map-shell";

const navigateToMock = vi.fn();
const recenterOnUserMock = vi.fn();

let mockMapPaddingReady = true;
let mockHasUserLocation = true;
let notifyShellMock: ((signal: CameraShellSignal) => void) | undefined;

vi.mock("../viewport", () => ({
  useLiveSheetObscuredBottomPx: () => ({
    sheetObscuredBottomPx: 0,
    onSheetLayoutFrameChange: vi.fn(),
  }),
  useMapVisibleViewportSync: () => ({
    clientRect: null,
    centerOffset: { x: 0, y: 0 },
    hasMinimumArea: false,
  }),
}));

const dispatchMock = vi.fn();

vi.mock("../camera", () => ({
  useMapUserTracking: (options: {
    onNotifyShell?: (signal: CameraShellSignal) => void;
  }) => {
    notifyShellMock = options.onNotifyShell;
    return {
      tracking: false,
      get mapPaddingReady() {
        return mockMapPaddingReady;
      },
      boot: "done",
      get hasUserLocation() {
        return mockHasUserLocation;
      },
      anchor: null,
      session: "idle",
      readCameraSession: () => "idle",
      navigateTo: navigateToMock,
      recenterOnUser: recenterOnUserMock,
      dispatch: (event: { type: string }) => {
        dispatchMock(event);
        if (event.type === "navigateRequested") {
          options.onNotifyShell?.({
            kind: "sessionChanged",
            previousSession: "idle",
            session: "flying",
          });
        }
      },
    };
  },
}));

describe("useMapShell", () => {
  beforeEach(() => {
    navigateToMock.mockClear();
    recenterOnUserMock.mockClear();
    dispatchMock.mockClear();
    mockMapPaddingReady = true;
    mockHasUserLocation = true;
    notifyShellMock = undefined;
    navigateToMock.mockReturnValue(true);
  });

  it("flies first and opens half after camera settles", async () => {
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

    expect(result.current.selectedItemId).toBe("a");
    expect(result.current.sheetSnap).toBe("collapsed");
    expect(dispatchMock).toHaveBeenCalledWith({
      type: "navigateRequested",
      position: { lat: 1, lng: 2 },
      mode: "fly",
      preserveTracking: false,
      durationMs: 600,
    });

    await act(async () => {
      notifyShellMock?.({
        kind: "sessionChanged",
        previousSession: "flying",
        session: "idle",
      });
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
        userLocation: { lat: 1, lng: 2 },
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

  it("reselect at full slides to half then flies after sheet rests", async () => {
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
      result.current.selectItem("a", { lat: 1, lng: 2 });
    });

    dispatchMock.mockClear();

    await act(async () => {
      result.current.selectItem("b", { lat: 3, lng: 4 });
    });

    expect(result.current.sheetSnap).toBe("half");
    expect(result.current.selectedItemId).toBe("b");
    expect(dispatchMock).not.toHaveBeenCalled();

    await act(async () => {
      result.current.handleSheetLayoutFrameChange({
        visibleHeightPx: 400,
        phase: "settling",
        restingSnap: "half",
      });
      result.current.handleSheetSnapSettled("half");
      result.current.handleSheetLayoutFrameChange({
        visibleHeightPx: 400,
        phase: "idle",
        restingSnap: "half",
      });
    });

    expect(dispatchMock).toHaveBeenCalledWith({
      type: "sheetPhaseChanged",
      phase: "idle",
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      type: "navigateRequested",
      position: { lat: 3, lng: 4 },
      mode: "fly",
      preserveTracking: false,
      durationMs: 600,
    });
  });

  it("reselect at full after pan flies when half snap settles", async () => {
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
      result.current.selectItem("a", { lat: 1, lng: 2 });
    });

    await act(async () => {
      notifyShellMock?.({
        kind: "sessionChanged",
        previousSession: "idle",
        session: "userGesture",
      });
    });

    await act(async () => {
      notifyShellMock?.({
        kind: "sessionChanged",
        previousSession: "userGesture",
        session: "idle",
      });
    });

    dispatchMock.mockClear();

    await act(async () => {
      result.current.selectItem("b", { lat: 3, lng: 4 });
    });

    expect(result.current.sheetSnap).toBe("half");
    expect(dispatchMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "navigateRequested" }),
    );

    await act(async () => {
      result.current.handleSheetLayoutFrameChange({
        visibleHeightPx: 400,
        phase: "settling",
        restingSnap: "half",
      });
      result.current.handleSheetSnapSettled("half");
      result.current.handleSheetLayoutFrameChange({
        visibleHeightPx: 400,
        phase: "idle",
        restingSnap: "half",
      });
    });

    expect(dispatchMock).toHaveBeenCalledWith({
      type: "sheetPhaseChanged",
      phase: "idle",
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      type: "navigateRequested",
      position: { lat: 3, lng: 4 },
      mode: "fly",
      preserveTracking: false,
      durationMs: 600,
    });
  });

  it("clears selection when dragging the sheet closed", async () => {
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

    await act(async () => {
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
      result.current.selectItem("a", { lat: 1, lng: 2 });
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
      result.current.selectItem("a", { lat: 1, lng: 2 });
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

  it("select during dismiss animation uses collapsed plan and flies after settle", async () => {
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

    await act(async () => {
      result.current.closeSheet();
    });

    expect(result.current.sheetSnap).toBe("collapsed");
    expect(result.current.selectedItemId).toBeNull();

    await act(async () => {
      result.current.handleSheetLayoutFrameChange({
        visibleHeightPx: 200,
        phase: "settling",
        restingSnap: "collapsed",
      });
    });

    dispatchMock.mockClear();

    await act(async () => {
      result.current.selectItem("b", { lat: 3, lng: 4 });
    });

    expect(result.current.selectedItemId).toBe("b");
    expect(result.current.sheetSnap).toBe("collapsed");
    expect(dispatchMock).not.toHaveBeenCalled();

    await act(async () => {
      result.current.handleSheetSnapSettled("collapsed");
      result.current.handleSheetLayoutFrameChange({
        visibleHeightPx: 200,
        phase: "idle",
        restingSnap: "collapsed",
      });
    });

    expect(dispatchMock).toHaveBeenCalledWith({
      type: "navigateRequested",
      position: { lat: 3, lng: 4 },
      mode: "fly",
      preserveTracking: false,
      durationMs: 600,
    });

    await act(async () => {
      notifyShellMock?.({
        kind: "sessionChanged",
        previousSession: "flying",
        session: "idle",
      });
    });

    expect(result.current.sheetSnap).toBe("half");
  });

  it("select during drag-close uses collapsed plan and flies after settle", async () => {
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

    await act(async () => {
      result.current.handleSheetLayoutFrameChange({
        visibleHeightPx: 200,
        phase: "dragging",
        restingSnap: "collapsed",
      });
    });

    expect(result.current.sheetSnap).toBe("collapsed");

    dispatchMock.mockClear();

    await act(async () => {
      result.current.selectItem("b", { lat: 3, lng: 4 });
    });

    expect(result.current.selectedItemId).toBe("b");
    expect(dispatchMock).toHaveBeenNthCalledWith(1, {
      type: "sheetPhaseChanged",
      phase: "dragging",
    });
    expect(dispatchMock).toHaveBeenNthCalledWith(2, {
      type: "navigateRequested",
      position: { lat: 3, lng: 4 },
      mode: "jump",
      preserveTracking: false,
      durationMs: undefined,
    });

    dispatchMock.mockClear();

    await act(async () => {
      result.current.handleSheetSnapSettled("collapsed");
      result.current.handleSheetLayoutFrameChange({
        visibleHeightPx: 200,
        phase: "idle",
        restingSnap: "collapsed",
      });
    });

    expect(
      dispatchMock.mock.calls.some(
        ([call]) => call.type === "navigateRequested",
      ),
    ).toBe(false);
  });

  it("exposes mapPaddingReady for location button disabled state", async () => {
    mockMapPaddingReady = false;

    const mapInstanceStore = createMapInstanceStore();
    const { result } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
        userLocation: { lat: 1, lng: 2 },
      }),
    );

    expect(result.current.mapPaddingReady).toBe(false);
    expect(result.current.userLocation).toEqual({ lat: 1, lng: 2 });
  });

  it("location button disabled when user location is absent", async () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
        userLocation: null,
      }),
    );

    expect(result.current.userLocation).toBeNull();
    expect(result.current.mapPaddingReady).toBe(true);
  });
});
