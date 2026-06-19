import { afterEach, describe, expect, it, vi } from "vitest";

import {
  bottomSheetSnapPointPx,
  measureCollapsedHeightPx,
  measureHandleBlockHeightPx,
} from "./snap-heights";

function stubOffsetHeight(element: HTMLElement, height: number) {
  Object.defineProperty(element, "offsetHeight", {
    configurable: true,
    value: height,
  });
}

describe("snap-heights", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("formats pixel snap points for Vaul", () => {
    expect(bottomSheetSnapPointPx(152.4)).toBe("152px");
  });

  it("includes handle top margin in handle block height", () => {
    const handle = document.createElement("div");
    stubOffsetHeight(handle, 4);
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      marginTop: "12px",
    } as CSSStyleDeclaration);

    expect(measureHandleBlockHeightPx(handle)).toBe(16);
  });

  it("sums handle, peek, and bottom inset heights", () => {
    const handle = document.createElement("div");
    stubOffsetHeight(handle, 16);

    const peek = document.createElement("div");
    stubOffsetHeight(peek, 120);

    expect(measureCollapsedHeightPx(handle, peek, 8, 800)).toBe(144);
  });

  it("falls back when nothing is measured", () => {
    expect(measureCollapsedHeightPx(null, null, 0)).toBe(150);
  });

  it("never returns a collapsed height at or above half the viewport", () => {
    const handle = document.createElement("div");
    stubOffsetHeight(handle, 16);

    const peek = document.createElement("div");
    stubOffsetHeight(peek, 600);

    expect(measureCollapsedHeightPx(handle, peek, 0, 800)).toBe(399);
  });
});
