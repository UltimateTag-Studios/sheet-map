import { renderHook, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mockCanvas, stubViewport } from "../testing/fixtures";
import { mountSheetHostFixture } from "../testing/mount-sheet-host-fixture";
import { useVisibleViewportSync } from "./use-visible-viewport-sync";

describe("useVisibleViewportSync", () => {
  beforeEach(() => {
    stubViewport();
    vi.stubGlobal(
      "ResizeObserver",
      vi.fn(() => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
      })),
    );
    vi.stubGlobal("visualViewport", {
      offsetTop: 0,
      offsetLeft: 0,
      height: 800,
      width: 400,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("updates when the sheet slide is mounted", async () => {
    const collapsedHeight = 152;
    const { canvas, remove } = mountSheetHostFixture(
      mockCanvas,
      {},
      {
        top: 800 - collapsedHeight,
        bottom: 800,
        height: collapsedHeight,
        y: 800 - collapsedHeight,
      },
    );

    const canvasRef = createRef<HTMLCanvasElement>();
    canvasRef.current = canvas;

    const { result } = renderHook(() => useVisibleViewportSync({ canvasRef }));

    await waitFor(() => {
      expect(result.current.hasVisibleArea).toBe(true);
    });
    expect(result.current.clientRect?.height).toBe(648);

    remove();
  });
});
