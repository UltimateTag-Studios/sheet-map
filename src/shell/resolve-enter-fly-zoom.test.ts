import { describe, expect, it } from "vitest";

import { resolveEnterFlyZoom } from "./resolve-enter-fly-zoom";

describe("resolveEnterFlyZoom", () => {
  const defaultZoom = 10;

  it("uses explicit zoom when provided", () => {
    expect(
      resolveEnterFlyZoom({
        explicitZoom: 14,
        anchorZoom: 12,
        defaultZoom,
      }),
    ).toBe(14);
  });

  it("preserves current zoom when explicit zoom is omitted and anchor has zoom", () => {
    expect(
      resolveEnterFlyZoom({
        anchorZoom: 12,
        defaultZoom,
      }),
    ).toBeUndefined();
  });

  it("falls back to default when no explicit or anchor zoom", () => {
    expect(resolveEnterFlyZoom({ defaultZoom })).toBe(defaultZoom);
  });
});
