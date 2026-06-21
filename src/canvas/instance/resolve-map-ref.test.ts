import { describe, expect, it } from "vitest";

import { resolveMapRef } from "./resolve-map-ref";

describe("resolveMapRef", () => {
  it("returns null when maps is null or undefined", () => {
    expect(resolveMapRef(null)).toBeNull();
    expect(resolveMapRef(undefined)).toBeNull();
  });

  it("prefers current over default", () => {
    const current = { getMap: () => ({}) };
    const fallback = { getMap: () => ({}) };

    expect(
      resolveMapRef({
        current: current as never,
        default: fallback as never,
      }),
    ).toBe(current);
  });

  it("falls back to default when current is missing", () => {
    const fallback = { getMap: () => ({}) };

    expect(resolveMapRef({ default: fallback as never })).toBe(fallback);
  });
});
