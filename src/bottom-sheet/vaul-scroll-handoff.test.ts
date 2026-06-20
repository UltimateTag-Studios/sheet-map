import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useVaulScrollHandoff } from "./vaul-scroll-handoff";

function createScrollNode(scrollTop = 0) {
  const attrs = new Map<string, string>();
  return {
    scrollTop,
    scrollTo: vi.fn(),
    contains: () => true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    setAttribute: vi.fn((name: string) => {
      attrs.set(name, "");
    }),
    removeAttribute: vi.fn((name: string) => {
      attrs.delete(name);
    }),
    hasAttribute: vi.fn((name: string) => attrs.has(name)),
  } as unknown as HTMLDivElement;
}

describe("useVaulScrollHandoff", () => {
  it("resets scrollTop when leaving scroll mode", () => {
    const node = createScrollNode();

    const { result, rerender } = renderHook(
      ({ scrollEnabled }) => useVaulScrollHandoff(scrollEnabled),
      { initialProps: { scrollEnabled: true } },
    );

    act(() => {
      result.current.scrollRootRef(node);
    });

    rerender({ scrollEnabled: false });

    expect(node.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("sets data-vaul-no-drag when scrollTop is below the top", () => {
    const node = createScrollNode(24);

    const { result } = renderHook(() => useVaulScrollHandoff(true));

    act(() => {
      result.current.scrollRootRef(node);
    });

    expect(node.setAttribute).toHaveBeenCalledWith("data-vaul-no-drag", "");
  });
});
