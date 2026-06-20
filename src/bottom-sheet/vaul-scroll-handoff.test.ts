import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { syncVaulDragGate, useVaulScrollHandoff } from "./vaul-scroll-handoff";

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

describe("syncVaulDragGate", () => {
  it("does not set no-drag at scroll top when body scroll is enabled", () => {
    const node = createScrollNode(0);
    syncVaulDragGate(node, true);
    expect(node.setAttribute).not.toHaveBeenCalled();
    expect(node.removeAttribute).toHaveBeenCalledWith("data-vaul-no-drag");
  });

  it("sets no-drag only when scrolled away from the top", () => {
    const node = createScrollNode(24);
    syncVaulDragGate(node, true);
    expect(node.setAttribute).toHaveBeenCalledWith("data-vaul-no-drag", "");
  });
});

describe("useVaulScrollHandoff", () => {
  it("resets scrollTop when body scroll is disabled", () => {
    const node = createScrollNode();

    const { result, rerender } = renderHook(
      ({ canBodyScroll }) => useVaulScrollHandoff(canBodyScroll),
      { initialProps: { canBodyScroll: true } },
    );

    act(() => {
      result.current.scrollRootRef(node);
    });

    rerender({ canBodyScroll: false });

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

  it("clears data-vaul-no-drag when not at full height", () => {
    const node = createScrollNode(12);

    const { result } = renderHook(() => useVaulScrollHandoff(false));

    act(() => {
      result.current.scrollRootRef(node);
    });

    expect(node.removeAttribute).toHaveBeenCalledWith("data-vaul-no-drag");
  });
});
