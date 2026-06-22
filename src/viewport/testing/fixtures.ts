import { vi } from "vitest";

export const snapHeights700 = { collapsed: 152, half: 350, full: 700 };
export const snapHeights750 = { collapsed: 152, half: 375, full: 750 };
export const noExtraInsets = { top: 0, left: 0, right: 0, bottom: 0 };

export function mockCanvas(
  overrides: Partial<HTMLCanvasElement> & {
    rect?: Partial<DOMRect>;
  } = {},
): HTMLCanvasElement {
  const rect = {
    top: 0,
    bottom: 800,
    left: 0,
    right: 400,
    width: 400,
    height: 800,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...overrides.rect,
  };

  return {
    clientWidth: rect.width,
    clientHeight: rect.height,
    getBoundingClientRect: () => rect as DOMRect,
    ...overrides,
  } as HTMLCanvasElement;
}

export function stubViewport(width = 400, height = 800) {
  vi.stubGlobal("visualViewport", {
    offsetTop: 0,
    offsetLeft: 0,
    height,
    width,
  });
  Object.defineProperty(window, "innerWidth", {
    value: width,
    configurable: true,
  });
  Object.defineProperty(window, "innerHeight", {
    value: height,
    configurable: true,
  });
}
