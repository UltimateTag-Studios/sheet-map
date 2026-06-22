import { describe, expect, it } from "vitest";

import type { MapRouteContent } from "./map-route-context";
import {
  resolveRouteHeader,
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
});
