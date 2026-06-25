import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { forwardRef, useEffect } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MapShellState } from "../shell/map-route-context";
import { MapRouteProvider } from "../shell/map-route-context";
import { MapShellSlotsProvider } from "../shell/map-shell-slots-context";
import { createTestMapRouteStores } from "../shell/testing/map-route-test-stores";
import { MapItemsLayer } from "./map-items-layer";
import type { MapItem } from "./types";

vi.mock("mapbox-gl/dist/mapbox-gl.css", () => ({}));

const mockMapRef = {
  getMap: () => ({
    isStyleLoaded: () => true,
    on: vi.fn(),
    off: vi.fn(),
  }),
} as unknown as MapRef;

vi.mock("react-map-gl/mapbox", () => {
  const Marker = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  );

  const GlMap = forwardRef<MapRef, { children?: React.ReactNode }>(
    ({ children }, ref) => {
      useEffect(() => {
        if (typeof ref === "function") {
          ref(mockMapRef);
        } else if (ref) {
          ref.current = mockMapRef;
        }
      }, [ref]);

      return <div data-testid="map">{children}</div>;
    },
  );

  return {
    default: GlMap,
    // biome-ignore lint/style/useNamingConvention: react-map-gl named export
    Marker,
  };
});

const items: MapItem[] = [
  {
    id: "located",
    location: { lat: 37.1, lng: -113.5 },
    title: "Located",
  },
];

describe("MapItemsLayer", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders markers only for located items", () => {
    const { routeContentStore } = createTestMapRouteStores();

    render(
      <MapRouteProvider
        shell={
          {
            selectedItemId: null,
            selectItem: vi.fn(),
          } as unknown as MapShellState
        }
        routeContentStore={routeContentStore}
      >
        <MapShellSlotsProvider slots={{}}>
          <MapItemsLayer items={items} />
        </MapShellSlotsProvider>
      </MapRouteProvider>,
    );

    expect(screen.getAllByTestId("marker")).toHaveLength(1);
  });

  it("calls selectItem when a default marker is pressed", () => {
    const selectItem = vi.fn();
    const { routeContentStore } = createTestMapRouteStores();

    render(
      <MapRouteProvider
        shell={
          {
            selectedItemId: null,
            selectItem,
          } as unknown as MapShellState
        }
        routeContentStore={routeContentStore}
      >
        <MapShellSlotsProvider slots={{}}>
          <MapItemsLayer items={items} />
        </MapShellSlotsProvider>
      </MapRouteProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Map item" }));

    expect(selectItem).toHaveBeenCalledWith("located", {
      lat: 37.1,
      lng: -113.5,
    });
  });
});
