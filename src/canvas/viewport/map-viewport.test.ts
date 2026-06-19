import { describe, expect, it, vi } from "vitest";

import {
  combineObscuredInsets,
  mapboxPointToVisiblePoint,
  mapboxRectToVisibleRect,
  mapboxViewboxFromContainer,
  mapboxViewboxFromVisible,
  obscuredInsetsForCollapsedSheet,
  obscuredInsetsFromScreenGeometry,
  resolveMapVisibleViewport,
  visibleClientRectFromScreenGeometry,
  visiblePointToMapboxPoint,
  visibleRectToMapboxRect,
  visibleViewboxCenter,
  visibleViewboxFromMapbox,
} from "./map-viewport";

const alignedGeometry = {
  canvasTop: 0,
  canvasBottom: 800,
  canvasLeft: 0,
  canvasRight: 400,
  viewportHeight: 800,
  viewportWidth: 400,
};

describe("map-viewport", () => {
  const container = { width: 400, height: 800 };
  const mapbox = mapboxViewboxFromContainer(container);
  const obscured = obscuredInsetsForCollapsedSheet(152);

  it("derives visible viewbox from mapbox viewbox", () => {
    const visible = visibleViewboxFromMapbox(mapbox, obscured);
    expect(visible).toEqual({ x: 0, y: 0, width: 400, height: 648 });
  });

  it("round-trips viewbox through mapbox", () => {
    const visible = visibleViewboxFromMapbox(mapbox, obscured);
    expect(mapboxViewboxFromVisible(visible, obscured)).toEqual(mapbox);
  });

  it("converts points between visible and mapbox coordinates", () => {
    const visiblePoint = { x: 10, y: 20 };
    const mapboxPoint = visiblePointToMapboxPoint(visiblePoint, obscured);
    expect(mapboxPoint).toEqual({ x: 10, y: 20 });
    expect(mapboxPointToVisiblePoint(mapboxPoint, obscured)).toEqual(
      visiblePoint,
    );
  });

  it("converts rects between visible and mapbox coordinates", () => {
    const visibleRect = { x: 8, y: 12, width: 120, height: 80 };
    const mapboxRect = visibleRectToMapboxRect(visibleRect, obscured);
    expect(mapboxRect).toEqual(visibleRect);
    expect(mapboxRectToVisibleRect(mapboxRect, obscured)).toEqual(visibleRect);
  });

  it("centers visible viewbox below the obscured bottom edge", () => {
    const visible = visibleViewboxFromMapbox(mapbox, obscured);
    expect(visibleViewboxCenter(visible)).toEqual({ x: 200, y: 324 });
  });

  it("combines obscured insets", () => {
    expect(
      combineObscuredInsets(
        { top: 80, left: 40, right: 40, bottom: 0 },
        obscured,
      ),
    ).toEqual({
      top: 80,
      left: 40,
      right: 40,
      bottom: 152,
    });
  });

  it("matches collapsed sheet height when canvas aligns with viewport bottom", () => {
    expect(
      obscuredInsetsFromScreenGeometry("collapsed", 152, 700, alignedGeometry)
        .bottom,
    ).toBe(152);
  });

  it("adds canvas overflow below the viewport to bottom obscured inset", () => {
    expect(
      obscuredInsetsFromScreenGeometry("collapsed", 152, 700, {
        ...alignedGeometry,
        canvasBottom: 850,
      }).bottom,
    ).toBe(202);
  });

  it("subtracts when canvas ends above the viewport bottom", () => {
    expect(
      obscuredInsetsFromScreenGeometry("collapsed", 152, 700, {
        ...alignedGeometry,
        canvasBottom: 766,
      }).bottom,
    ).toBe(118);
  });

  it("derives visible client rect from screen geometry", () => {
    expect(
      visibleClientRectFromScreenGeometry(
        "collapsed",
        152,
        700,
        alignedGeometry,
      ),
    ).toEqual({ x: 0, y: 0, width: 400, height: 648 });
  });

  it("reports no visible area when the sheet is full height", () => {
    expect(
      visibleClientRectFromScreenGeometry("full", 152, 800, alignedGeometry),
    ).toEqual({ x: 0, y: 0, width: 400, height: 0 });
  });

  it("offsets flyTo center toward the visible-map center above a bottom sheet", () => {
    vi.stubGlobal("visualViewport", {
      offsetTop: 0,
      offsetLeft: 0,
      height: 800,
      width: 400,
    });
    Object.defineProperty(window, "innerWidth", {
      value: 400,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
    });

    const canvas = {
      clientWidth: 400,
      clientHeight: 800,
      getBoundingClientRect: () => ({
        top: 0,
        bottom: 800,
        left: 0,
        right: 400,
        width: 400,
        height: 800,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    } as HTMLCanvasElement;

    expect(resolveMapVisibleViewport(canvas, "collapsed", 152, 700)).toEqual({
      clientRect: { x: 0, y: 0, width: 400, height: 648 },
      centerOffset: { x: 0, y: -76 },
      hasVisibleArea: true,
    });
  });

  it("skips camera focus when the sheet covers the map", () => {
    vi.stubGlobal("visualViewport", {
      offsetTop: 0,
      offsetLeft: 0,
      height: 800,
      width: 400,
    });

    const canvas = {
      clientWidth: 400,
      clientHeight: 800,
      getBoundingClientRect: () => ({
        top: 0,
        bottom: 800,
        left: 0,
        right: 400,
        width: 400,
        height: 800,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    } as HTMLCanvasElement;

    expect(resolveMapVisibleViewport(canvas, "full", 152, 800)).toEqual({
      clientRect: { x: 0, y: 0, width: 400, height: 0 },
      centerOffset: { x: 0, y: -400 },
      hasVisibleArea: false,
    });
  });

  it("falls back to window size when visualViewport height is zero", () => {
    vi.stubGlobal("visualViewport", {
      offsetTop: 0,
      offsetLeft: 0,
      height: 0,
      width: 0,
    });
    Object.defineProperty(window, "innerWidth", {
      value: 400,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
    });

    const canvas = {
      clientWidth: 400,
      clientHeight: 800,
      getBoundingClientRect: () => ({
        top: 0,
        bottom: 800,
        left: 0,
        right: 400,
        width: 400,
        height: 800,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    } as HTMLCanvasElement;

    expect(resolveMapVisibleViewport(canvas, "collapsed", 152, 700)).toEqual({
      clientRect: { x: 0, y: 0, width: 400, height: 648 },
      centerOffset: { x: 0, y: -76 },
      hasVisibleArea: true,
    });
  });

  it("applies fixed chrome insets to the visible rect", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 400,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
    });

    const canvas = {
      clientWidth: 400,
      clientHeight: 800,
      getBoundingClientRect: () => ({
        top: 0,
        bottom: 800,
        left: 0,
        right: 400,
        width: 400,
        height: 800,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    } as HTMLCanvasElement;

    const withoutTabBar = resolveMapVisibleViewport(
      canvas,
      "collapsed",
      152,
      700,
    );
    const withTabBar = resolveMapVisibleViewport(
      canvas,
      "collapsed",
      152,
      700,
      {
        top: 0,
        left: 0,
        right: 0,
        bottom: 56,
      },
    );

    expect(withTabBar.clientRect.height).toBe(
      withoutTabBar.clientRect.height - 56,
    );
    expect(withTabBar.centerOffset.y).toBeLessThan(
      withoutTabBar.centerOffset.y,
    );
  });
});
