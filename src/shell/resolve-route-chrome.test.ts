import { describe, expect, it, vi } from "vitest";

import type { MapItem } from "../items/types";
import type { MapRouteContent } from "./map-route-context";
import {
  resolveRouteActionChrome,
  resolveRouteBody,
  resolveRouteHeader,
  resolveRouteMapLayers,
  resolveRouteOverlay,
} from "./resolve-route-chrome";

describe("resolveRouteChrome", () => {
  it("prefers headerContent over header data", () => {
    const content: MapRouteContent = {
      headerContent: "custom-header",
      header: { title: "Ignored" },
    };

    expect(resolveRouteHeader(content, {})).toBe("custom-header");
  });

  it("renders header from slot when header data is provided", () => {
    const node = resolveRouteHeader(
      { header: { title: "Inventory", subtitle: "3 tags" } },
      {
        renderSheetHeader: (header) => `header:${header.title}`,
      },
    );

    expect(node).toBe("header:Inventory");
  });

  it("returns null when header data exists but no slot is configured", () => {
    const node = resolveRouteHeader({ header: { title: "Inventory" } }, {});

    expect(node).toBeNull();
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

  it("shows default action button when the sheet is open", () => {
    const node = resolveRouteActionChrome(
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

  it("shows collapsedAction when the sheet is collapsed", () => {
    const node = resolveRouteActionChrome(
      { collapsedAction: "back" },
      {},
      {
        sheetSnap: "collapsed",
        closeSheet: vi.fn(),
        closeAriaLabel: "Close sheet",
      },
    );

    expect(node).toBe("back");
  });

  it("prefers route renderActionButton over default close", () => {
    const node = resolveRouteActionChrome(
      {
        slots: {
          renderActionButton: () => "custom-action",
        },
      },
      {},
      {
        sheetSnap: "full",
        closeSheet: vi.fn(),
        closeAriaLabel: "Close sheet",
      },
    );

    expect(node).toBe("custom-action");
  });

  it("auto-renders MapSheetList when listStatus is ready and items exist", () => {
    const items: MapItem[] = [
      {
        id: "a",
        location: { lat: 1, lng: 2 },
        title: "Alpha",
      },
    ];

    const body = resolveRouteBody(
      { listStatus: "ready", items, header: { title: "Test" } },
      {},
      null,
    );

    expect(body).toBeTruthy();
  });

  it("infers ready listStatus when items are provided", () => {
    const items: MapItem[] = [
      {
        id: "a",
        location: { lat: 1, lng: 2 },
        title: "Alpha",
      },
    ];

    const body = resolveRouteBody({ items }, {}, null);

    expect(body).toBeTruthy();
  });

  it("renders loading slot when listStatus is loading", () => {
    const body = resolveRouteBody(
      { listStatus: "loading" },
      { renderSheetListLoading: () => "loading-copy" },
      null,
    );

    expect(body).toBeTruthy();
  });

  it("renders empty slot when listStatus is empty", () => {
    const body = resolveRouteBody(
      { listStatus: "empty" },
      { renderSheetListEmpty: () => "empty-copy" },
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

  it("returns null map layers when items list is empty", () => {
    const layers = resolveRouteMapLayers({ items: [] });

    expect(layers).toBeNull();
  });
});
