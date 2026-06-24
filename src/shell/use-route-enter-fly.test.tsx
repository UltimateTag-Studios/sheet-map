/** @vitest-environment jsdom */

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MapShellState } from "./map-route-context";
import { MapRouteProvider } from "./map-route-context";
import { createTestMapRouteStores } from "./testing/map-route-test-stores";
import { useRouteEnterFly } from "./use-route-enter-fly";

function createShellStub() {
  return {
    reportRouteEnterFly: vi.fn(),
  } as unknown as MapShellState;
}

describe("useRouteEnterFly", () => {
  it("reports item entry to the shell", () => {
    const shell = createShellStub();
    const { routeContentStore } = createTestMapRouteStores();

    const { unmount } = renderHook(
      () =>
        useRouteEnterFly("trail-a", {
          kind: "item",
          id: "capture-a",
          location: { lat: 1, lng: 2 },
        }),
      {
        wrapper: ({ children }) => (
          <MapRouteProvider shell={shell} routeContentStore={routeContentStore}>
            {children}
          </MapRouteProvider>
        ),
      },
    );

    expect(shell.reportRouteEnterFly).toHaveBeenCalledWith("trail-a", {
      kind: "item",
      id: "capture-a",
      location: { lat: 1, lng: 2 },
    });

    unmount();

    expect(shell.reportRouteEnterFly).toHaveBeenLastCalledWith("", null);
  });

  it("does not churn when entry value is unchanged", () => {
    const shell = createShellStub();
    const { routeContentStore } = createTestMapRouteStores();

    const { rerender } = renderHook(
      ({ entry }) => useRouteEnterFly("inventory", entry),
      {
        initialProps: {
          entry: { kind: "userLocation" as const },
        },
        wrapper: ({ children }) => (
          <MapRouteProvider shell={shell} routeContentStore={routeContentStore}>
            {children}
          </MapRouteProvider>
        ),
      },
    );

    vi.mocked(shell.reportRouteEnterFly).mockClear();

    rerender({ entry: { kind: "userLocation" } });

    expect(shell.reportRouteEnterFly).not.toHaveBeenCalled();
  });

  it("does not churn when shell object identity changes", () => {
    const reportRouteEnterFly = vi.fn();
    const { routeContentStore } = createTestMapRouteStores();

    const { rerender } = renderHook(
      () => useRouteEnterFly("inventory", { kind: "userLocation" }),
      {
        wrapper: ({ children }) => (
          <MapRouteProvider
            shell={{ reportRouteEnterFly } as unknown as MapShellState}
            routeContentStore={routeContentStore}
          >
            {children}
          </MapRouteProvider>
        ),
      },
    );

    reportRouteEnterFly.mockClear();

    rerender();

    expect(reportRouteEnterFly).not.toHaveBeenCalled();
  });
});
