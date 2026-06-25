import { render, screen } from "@testing-library/react";
import { forwardRef, useEffect } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestMapRef } from "../camera/testing/create-test-map-ref";
import { stubViewport } from "../viewport/testing/fixtures";

vi.mock("mapbox-gl/dist/mapbox-gl.css", () => ({}));

const { mapRef: mockMapRef } = createTestMapRef();

vi.mock("react-map-gl/mapbox", () => {
  const GlMap = forwardRef<
    MapRef,
    {
      children?: React.ReactNode;
      onLoad?: () => void;
    }
  >(({ children, onLoad }, ref) => {
    useEffect(() => {
      if (typeof ref === "function") {
        ref(mockMapRef);
      } else if (ref) {
        ref.current = mockMapRef;
      }
      onLoad?.();
    }, [onLoad, ref]);

    return <div data-testid="mock-map">{children}</div>;
  });

  const reactMapGlMock: Record<string, unknown> = {
    default: GlMap,
    useMap: () => ({ current: mockMapRef }),
  };
  reactMapGlMock.Layer = () => null;
  reactMapGlMock.Source = ({ children }: { children?: React.ReactNode }) =>
    children;

  return reactMapGlMock;
});

import { MapLayout } from "./map-layout";
import { useRegisterMapRoute } from "./use-register-map-route";

function TestRoute() {
  useRegisterMapRoute({
    header: { title: "Test route" },
    bodyContent: <p>Route body</p>,
  });
  return null;
}

describe("MapLayout", () => {
  beforeEach(() => {
    stubViewport();
    vi.stubGlobal(
      "ResizeObserver",
      vi.fn(() => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
      })),
    );
    vi.stubGlobal("visualViewport", {
      offsetTop: 0,
      offsetLeft: 0,
      height: 800,
      width: 400,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("renders shell chrome and registers route content", () => {
    render(
      <MemoryRouter initialEntries={["/map"]}>
        <Routes>
          <Route
            path="/map"
            element={
              <div style={{ height: 480 }}>
                <MapLayout accessToken="test-token">
                  <TestRoute />
                </MapLayout>
              </div>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Test route")).toBeDefined();
    expect(screen.getByText("Route body")).toBeDefined();
  });

  it("shows token missing message when access token is empty", () => {
    render(
      <MemoryRouter initialEntries={["/map"]}>
        <Routes>
          <Route
            path="/map"
            element={
              <MapLayout accessToken="">
                <TestRoute />
              </MapLayout>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Map token is missing.")).toBeDefined();
  });

  it("applies light theme on the layout root by default", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/map"]}>
        <Routes>
          <Route
            path="/map"
            element={
              <div style={{ height: 480 }}>
                <MapLayout accessToken="test-token">
                  <TestRoute />
                </MapLayout>
              </div>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    const layoutRoot = container.querySelector(".sheet-map-layout");
    expect(layoutRoot?.getAttribute("data-sheet-map-theme")).toBe("light");
  });

  it("applies dark theme when config.theme is dark", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/map"]}>
        <Routes>
          <Route
            path="/map"
            element={
              <div style={{ height: 480 }}>
                <MapLayout accessToken="test-token" config={{ theme: "dark" }}>
                  <TestRoute />
                </MapLayout>
              </div>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    const layoutRoot = container.querySelector(".sheet-map-layout");
    expect(layoutRoot?.getAttribute("data-sheet-map-theme")).toBe("dark");
  });
});
