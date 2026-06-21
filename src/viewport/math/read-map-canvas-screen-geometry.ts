import type { MapCanvasScreenGeometry } from "../types";
import { readVisualViewportLayout } from "./read-visual-viewport-layout";

/** Read canvas + viewport geometry from a map canvas element. */
export function readMapCanvasScreenGeometry(
  canvas: HTMLCanvasElement,
): MapCanvasScreenGeometry {
  const canvasRect = canvas.getBoundingClientRect();

  return {
    canvasTop: canvasRect.top,
    canvasBottom: canvasRect.bottom,
    canvasLeft: canvasRect.left,
    canvasRight: canvasRect.right,
    ...readVisualViewportLayout(),
  };
}
