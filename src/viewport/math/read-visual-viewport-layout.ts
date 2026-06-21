import type { MapCanvasScreenGeometry } from "../types";

export function readVisualViewportLayout(): Pick<
  MapCanvasScreenGeometry,
  "viewportTop" | "viewportLeft" | "viewportHeight" | "viewportWidth"
> {
  const viewport = window.visualViewport;
  const viewportWidth =
    viewport && viewport.width > 0 ? viewport.width : window.innerWidth;
  const viewportHeight =
    viewport && viewport.height > 0 ? viewport.height : window.innerHeight;

  return {
    viewportTop: viewport?.offsetTop ?? 0,
    viewportLeft: viewport?.offsetLeft ?? 0,
    viewportHeight,
    viewportWidth,
  };
}
