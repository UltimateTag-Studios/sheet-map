import { render, screen } from "@testing-library/react";
import { forwardRef, useEffect } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { describe, expect, it, vi } from "vitest";

import { MAP_CANVAS_ROOT_CLASS, MapCanvas } from "./map-canvas";

vi.mock("mapbox-gl/dist/mapbox-gl.css", () => ({}));

const mockMapRef = {
  getMap: () => ({
    isStyleLoaded: () => true,
    on: vi.fn(),
    off: vi.fn(),
  }),
} as unknown as MapRef;

const mockGlMapHandlers: { onLoad: (() => void) | undefined } = {
  onLoad: undefined,
};

function fireMockOnLoad(): void {
  const handler = mockGlMapHandlers.onLoad;
  if (!handler) {
    throw new Error("expected mock GlMap onLoad");
  }
  handler();
}

vi.mock("react-map-gl/mapbox", () => {
  const GlMap = forwardRef<
    MapRef,
    {
      children?: React.ReactNode;
      style?: React.CSSProperties;
      mapboxAccessToken?: string;
      mapStyle?: string;
      initialViewState?: {
        longitude: number;
        latitude: number;
        zoom: number;
      };
      onLoad?: () => void;
    }
  >(
    (
      {
        children,
        style,
        mapboxAccessToken,
        mapStyle,
        initialViewState,
        onLoad,
      },
      ref,
    ) => {
      useEffect(() => {
        mockGlMapHandlers.onLoad = onLoad;
        if (typeof ref === "function") {
          ref(mockMapRef);
        } else if (ref) {
          ref.current = mockMapRef;
        }
      }, [onLoad, ref]);

      return (
        <div
          data-testid="gl-map"
          data-token={mapboxAccessToken}
          data-style={mapStyle}
          data-longitude={initialViewState?.longitude}
          data-latitude={initialViewState?.latitude}
          data-zoom={initialViewState?.zoom}
          style={style}
        >
          {children}
        </div>
      );
    },
  );

  return {
    default: GlMap,
  };
});

describe("MapCanvas", () => {
  it("renders a full-size root and passes map props through", () => {
    render(
      <MapCanvas
        accessToken="test-token"
        styleUrl="mapbox://styles/mapbox/streets-v12"
        initialLongitude={1}
        initialLatitude={2}
        initialZoom={9}
        className="sheet-map-canvas-layer"
      />,
    );

    const root = screen.getByTestId("gl-map").parentElement;
    expect(root?.className).toContain(MAP_CANVAS_ROOT_CLASS);
    expect(root?.className).toContain("sheet-map-canvas-layer");

    const map = screen.getByTestId("gl-map");
    expect(map.getAttribute("data-token")).toBe("test-token");
    expect(map.getAttribute("data-style")).toBe(
      "mapbox://styles/mapbox/streets-v12",
    );
    expect(map.getAttribute("data-longitude")).toBe("1");
    expect(map.getAttribute("data-latitude")).toBe("2");
    expect(map.getAttribute("data-zoom")).toBe("9");
    expect(map.style.width).toBe("100%");
    expect(map.style.height).toBe("100%");
  });

  it("does not publish the map ref until onLoad", () => {
    const publishMapInstance = vi.fn();
    mockGlMapHandlers.onLoad = undefined;

    render(
      <MapCanvas
        accessToken="test-token"
        publishMapInstance={publishMapInstance}
      />,
    );

    expect(publishMapInstance).not.toHaveBeenCalled();

    fireMockOnLoad();
    expect(publishMapInstance).toHaveBeenCalledWith(mockMapRef);
  });

  it("publishes null on unmount", () => {
    const publishMapInstance = vi.fn();

    const { unmount } = render(
      <MapCanvas
        accessToken="test-token"
        publishMapInstance={publishMapInstance}
      />,
    );

    fireMockOnLoad();
    publishMapInstance.mockClear();

    unmount();
    expect(publishMapInstance).toHaveBeenCalledWith(null);
  });
});
