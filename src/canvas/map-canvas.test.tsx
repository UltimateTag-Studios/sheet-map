import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MAP_CANVAS_ROOT_CLASS, MapCanvas } from "./map-canvas";

vi.mock("mapbox-gl/dist/mapbox-gl.css", () => ({}));

vi.mock("react-map-gl/mapbox", () => {
  const GlMap = ({
    children,
    style,
    mapboxAccessToken,
    mapStyle,
    initialViewState,
  }: {
    children?: React.ReactNode;
    style?: React.CSSProperties;
    mapboxAccessToken?: string;
    mapStyle?: string;
    initialViewState?: {
      longitude: number;
      latitude: number;
      zoom: number;
    };
  }) => (
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

  return {
    default: GlMap,
    useMap: () => ({}),
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
});
