import type { ReactElement } from "react";
import {
  act,
  createElement,
  StrictMode,
  useEffect,
  useRef,
  useState,
} from "react";
import { createRoot, type Root } from "react-dom/client";

import type { SheetMotionPhase } from "../../viewport";
import { mockCanvas, stubViewport } from "../../viewport/testing/fixtures";
import { mountSheetHostFixture } from "../../viewport/testing/mount-sheet-host-fixture";
import type { MapCameraBootRequest } from "../hooks/types";
import { useMapCamera } from "../hooks/use-map-camera";
import type { MapAnchorFollowConfig } from "../lib";
import type { MapPosition } from "../shared/map-position";
import { positionKey } from "../shared/map-position";
import {
  createTestMapRef,
  type TestMapRefHarness,
} from "./create-test-map-ref";
import { flushDeferredMapInstanceRelease } from "./flush-deferred-map-instance-release";

export type MapAnchorHookResult = ReturnType<typeof useMapCamera>;

export type MountAnchorOptions = {
  liveSheetObscuredBottomPx?: number;
  sheetPhase?: SheetMotionPhase;
  bootTarget?: MapPosition | null;
  bootDurationMs?: number;
  smoothFlyDurationMs?: number;
  styleLoaded?: boolean;
  follow?: MapAnchorFollowConfig | null;
  onReleaseTracking?: () => void;
};

function renderStrictMode(element: ReactElement) {
  return createElement(StrictMode, null, element);
}

function buildBootRequest(
  bootTarget: MapPosition | null | undefined,
  follow?: MapAnchorFollowConfig | null,
): MapCameraBootRequest | null {
  if (!bootTarget) {
    return null;
  }

  const followConfig = follow ?? {
    userLocation: { lat: bootTarget.lat, lng: bootTarget.lng },
    centerOffset: { x: 0, y: 0 },
    thresholdPx: 40,
  };

  return {
    position: bootTarget,
    follow: followConfig,
    positionKey: positionKey(bootTarget),
  };
}

function useMapCameraHarness(
  mapRef: TestMapRefHarness["mapRef"],
  options: MountAnchorOptions,
) {
  const camera = useMapCamera({
    mapRef,
    liveSheetObscuredBottomPx: options.liveSheetObscuredBottomPx,
    sheetPhase: options.sheetPhase,
    bootRequest: buildBootRequest(options.bootTarget, options.follow),
    bootDurationMs: options.bootDurationMs,
    smoothFlyDurationMs: options.smoothFlyDurationMs,
    onReleaseTracking: options.onReleaseTracking,
  });

  const dispatchRef = useRef(camera.dispatch);
  dispatchRef.current = camera.dispatch;

  useEffect(() => {
    if (!options.follow) {
      return;
    }

    dispatchRef.current({ type: "startTracking", follow: options.follow });
  }, [options.follow]);

  return camera;
}

function renderMapAnchorHarness(
  harness: TestMapRefHarness,
  renderHook: () => MapAnchorHookResult,
  onUnmount?: () => void,
) {
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  const latestRef: { current: MapAnchorHookResult | null } = { current: null };

  act(() => {
    root.render(
      renderStrictMode(
        createElement(() => {
          latestRef.current = renderHook();
          return null;
        }),
      ),
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
    async unmount() {
      act(() => {
        root.unmount();
      });
      await flushDeferredMapInstanceRelease();
      onUnmount?.();
    },
  };
}

export function mountAnchorWithMapRef(
  harness: TestMapRefHarness,
  options: MountAnchorOptions = {},
) {
  return renderMapAnchorHarness(harness, () =>
    useMapCameraHarness(harness.mapRef, options),
  );
}

export function mountAnchor(options: MountAnchorOptions = {}) {
  return mountAnchorWithMapRef(
    createTestMapRef({ styleLoaded: options.styleLoaded }),
    options,
  );
}

export type LiveSheetPaddingHarness = ReturnType<
  typeof mountAnchorWithLiveSheetPadding
>;

export function mountAnchorWithLiveSheetPadding(
  initialPx = 152,
  options: Omit<MountAnchorOptions, "liveSheetObscuredBottomPx"> = {},
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
  let setSheetPhase: ((next: SheetMotionPhase) => void) | null = null;

  const updateSheetRect = (obscuredBottomPx: number) => {
    fixture.sheet.getBoundingClientRect = () =>
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
      renderStrictMode(
        createElement(function Harness() {
          const [liveSheetObscuredBottomPx, setLiveSheetObscuredBottomPx] =
            useState(initialPx);
          const [sheetPhase, setSheetPhaseState] =
            useState<SheetMotionPhase>("idle");
          setLivePx = setLiveSheetObscuredBottomPx;
          setSheetPhase = setSheetPhaseState;
          latestRef.current = useMapCameraHarness(harness.mapRef, {
            liveSheetObscuredBottomPx,
            sheetPhase,
            ...options,
          });
          return null;
        }),
      ),
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
      updateSheetRect(nextPx);
      act(() => {
        setLivePx?.(nextPx);
      });
    },
    setSheetPhase(next: SheetMotionPhase) {
      act(() => {
        setSheetPhase?.(next);
      });
    },
    async unmount() {
      act(() => {
        root.unmount();
      });
      await flushDeferredMapInstanceRelease();
      fixture.remove();
    },
  };
}

export function mountAnchorWithDeferredBootTarget(initialPx = 152) {
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
      renderStrictMode(
        createElement(function Harness() {
          const [bootTarget, setBootTargetState] = useState<MapPosition | null>(
            null,
          );
          setBootTarget = setBootTargetState;
          latestRef.current = useMapCameraHarness(harness.mapRef, {
            liveSheetObscuredBottomPx: initialPx,
            bootTarget,
          });
          return null;
        }),
      ),
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
    async unmount() {
      act(() => {
        root.unmount();
      });
      await flushDeferredMapInstanceRelease();
      fixture.remove();
    },
  };
}

/** Alias for padding + anchor integration tests. */
export const mountPaddingAnchorHarness = mountAnchorWithLiveSheetPadding;
