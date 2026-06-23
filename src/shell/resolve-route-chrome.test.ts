import { describe, expect, it, vi } from "vitest";

import type { MapItem } from "../items/types";
import type { MapRouteContent } from "./map-route-context";
import {
  resolveRouteBody,
  resolveRouteHeader,
  resolveRouteMapLayers,
  resolveRouteOverlay,
  resolveRouteTopRightChrome,
} from "./resolve-route-chrome";

describe("resolveRouteChrome", () => {
  it("prefers headerContent over header data", () => {
    const content: MapRouteContent = {
      headerContent: "custom-header",
      header: { title: "Ignored" },
    };

    expect(resolveRouteHeader(content, {})).toBe("custom-header");
  });

  it("renders default header from header data", () => {
    const node = resolveRouteHeader(
      { header: { title: "Inventory", countLabel: "3 tags" } },
      {},
    );

    expect(node).toBeTruthy();
  });

  it("route overlay null suppresses layout overlay", () => {
    const overlay = resolveRouteOverlay(
      { overlay: null },
      {
        renderOverlay: () => "layout-overlay",
      },
      { clientRect: null, tracking: false },
    );

    expect(overlay).toBeNull();
  });

  it("route overlay replaces layout overlay", () => {
    const overlay = resolveRouteOverlay(
      { overlay: "route-overlay" },
      {
        renderOverlay: () => "layout-overlay",
      },
      { clientRect: null, tracking: false },
    );

    expect(overlay).toBe("route-overlay");
  });

  it("shows default close button when the sheet is open", () => {
    const node = resolveRouteTopRightChrome(
      null,
      {},
      {
        sheetSnap: "half",
        closeSheet: vi.fn(),
        closeAriaLabel: "Close sheet",
      },
    );

    expect(node).toBeTruthy();
  });

  it("shows collapsedTopRight when the sheet is collapsed", () => {
    const node = resolveRouteTopRightChrome(
      { collapsedTopRight: "back" },
      {},
      {
        sheetSnap: "collapsed",
        closeSheet: vi.fn(),
        closeAriaLabel: "Close sheet",
      },
    );

    expect(node).toBe("back");
  });

  it("prefers route renderCloseButton over default close", () => {
    const node = resolveRouteTopRightChrome(
      {
        slots: {
          renderCloseButton: () => "custom-close",
        },
      },
      {},
      {
        sheetSnap: "full",
        closeSheet: vi.fn(),
        closeAriaLabel: "Close sheet",
      },
    );

    expect(node).toBe("custom-close");
  });

  it("auto-renders MapSheetList when body is omitted and items exist", () => {
    const items: MapItem[] = [
      {
        id: "a",
        location: { lat: 1, lng: 2 },
        title: "Alpha",
      },
    ];

    const body = resolveRouteBody(
      { items, header: { title: "Test" } },
      {},
      null,
    );

    expect(body).toBeTruthy();
  });

  it("auto-renders MapItemsLayer when mapLayers omitted and items have locations", () => {
    const items: MapItem[] = [
      {
        id: "a",
        location: { lat: 1, lng: 2 },
        title: "Alpha",
      },
    ];

    const layers = resolveRouteMapLayers({ items });

    expect(layers).toBeTruthy();
  });

  it("returns null map layers when items have no locations", () => {
    const layers = resolveRouteMapLayers({
      items: [{ id: "a", location: null, title: "Alpha" }],
    });

    expect(layers).toBeNull();
  });
});
