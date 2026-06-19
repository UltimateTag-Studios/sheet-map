import type { BottomSheetSnap } from "../../bottom-sheet/bottom-sheet";
import { DEFAULT_HALF_SNAP_FRACTION } from "../../shell/normalize-half-snap-fraction";

export type PixelSize = {
  width: number;
  height: number;
};

export type PixelPoint = {
  x: number;
  y: number;
};

export type PixelRect = PixelPoint & PixelSize;

/** Screen-space insets that obscure the map container edges (e.g. bottom sheet). */
export type MapObscuredInsets = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

/** Mapbox `flyTo` / `fitBounds` padding — same shape as obscured insets. */
export type MapboxCameraPadding = MapObscuredInsets;

/** Unobscured map region for a sheet snap + live canvas geometry. */
export type MapVisibleViewport = {
  /** Client-pixel rect (debug overlay, above fixed chrome). */
  clientRect: PixelRect;
  /**
   * Offset from canvas center to `clientRect` center (pixels).
   * Use with `flyTo`, `easeTo`, or any camera API that accepts `offset`.
   */
  centerOffset: PixelPoint;
  /** False when the sheet covers the map (e.g. full snap — no camera nudge). */
  hasVisibleArea: boolean;
};

/** Full map container bounds in screen pixels (the Mapbox canvas). */
export function mapboxViewboxFromContainer(size: PixelSize): PixelRect {
  return { x: 0, y: 0, width: size.width, height: size.height };
}

/** Visible map area after applying obscured insets. */
export function visibleViewboxFromMapbox(
  mapbox: PixelRect,
  obscured: MapObscuredInsets,
): PixelRect {
  return {
    x: mapbox.x + obscured.left,
    y: mapbox.y + obscured.top,
    width: mapbox.width - obscured.left - obscured.right,
    height: mapbox.height - obscured.top - obscured.bottom,
  };
}

/** Reconstruct the full Mapbox viewbox that contains a visible sub-rect. */
export function mapboxViewboxFromVisible(
  visible: PixelRect,
  obscured: MapObscuredInsets,
): PixelRect {
  return {
    x: visible.x - obscured.left,
    y: visible.y - obscured.top,
    width: visible.width + obscured.left + obscured.right,
    height: visible.height + obscured.top + obscured.bottom,
  };
}

/** Convert a point from visible-map coordinates to Mapbox container coordinates. */
export function visiblePointToMapboxPoint(
  point: PixelPoint,
  obscured: Pick<MapObscuredInsets, "top" | "left">,
): PixelPoint {
  return { x: point.x + obscured.left, y: point.y + obscured.top };
}

/** Convert a point from Mapbox container coordinates to visible-map coordinates. */
export function mapboxPointToVisiblePoint(
  point: PixelPoint,
  obscured: Pick<MapObscuredInsets, "top" | "left">,
): PixelPoint {
  return { x: point.x - obscured.left, y: point.y - obscured.top };
}

/** Convert a rect from visible-map coordinates to Mapbox container coordinates. */
export function visibleRectToMapboxRect(
  rect: PixelRect,
  obscured: Pick<MapObscuredInsets, "top" | "left">,
): PixelRect {
  return {
    x: rect.x + obscured.left,
    y: rect.y + obscured.top,
    width: rect.width,
    height: rect.height,
  };
}

/** Convert a rect from Mapbox container coordinates to visible-map coordinates. */
export function mapboxRectToVisibleRect(
  rect: PixelRect,
  obscured: Pick<MapObscuredInsets, "top" | "left">,
): PixelRect {
  return {
    x: rect.x - obscured.left,
    y: rect.y - obscured.top,
    width: rect.width,
    height: rect.height,
  };
}

export function visibleViewboxCenter(visible: PixelRect): PixelPoint {
  return {
    x: visible.x + visible.width / 2,
    y: visible.y + visible.height / 2,
  };
}

export function mapboxViewboxCenter(mapbox: PixelRect): PixelPoint {
  return {
    x: mapbox.x + mapbox.width / 2,
    y: mapbox.y + mapbox.height / 2,
  };
}

/** Sum per-edge insets (e.g. bottom sheet + legend chrome). */
export function combineObscuredInsets(
  ...parts: MapObscuredInsets[]
): MapObscuredInsets {
  return parts.reduce<MapObscuredInsets>(
    (acc, part) => ({
      top: acc.top + part.top,
      left: acc.left + part.left,
      right: acc.right + part.right,
      bottom: acc.bottom + part.bottom,
    }),
    { top: 0, left: 0, right: 0, bottom: 0 },
  );
}

export function obscuredInsetsForCollapsedSheet(
  collapsedHeightPx: number,
): MapObscuredInsets {
  return {
    top: 0,
    left: 0,
    right: 0,
    bottom: collapsedHeightPx,
  };
}

function sheetObscuredHeightFromViewportBottom(
  snap: BottomSheetSnap,
  viewportHeight: number,
  collapsedHeightPx: number,
  fullHeightPx: number,
  halfSnapFraction: number = DEFAULT_HALF_SNAP_FRACTION,
): number {
  if (snap === "collapsed") {
    return collapsedHeightPx;
  }
  if (snap === "full") {
    return fullHeightPx;
  }
  return viewportHeight * halfSnapFraction;
}

export type MapCanvasScreenGeometry = {
  canvasTop: number;
  canvasBottom: number;
  canvasLeft: number;
  canvasRight: number;
  viewportTop?: number;
  viewportLeft?: number;
  viewportHeight: number;
  viewportWidth: number;
};

/** Mapbox canvas padding matching viewport-fixed UI (sheet, safe areas). */
export function obscuredInsetsFromScreenGeometry(
  snap: BottomSheetSnap,
  collapsedHeightPx: number,
  fullHeightPx: number,
  geometry: MapCanvasScreenGeometry,
  halfSnapFraction: number = DEFAULT_HALF_SNAP_FRACTION,
): MapObscuredInsets {
  const viewportTop = geometry.viewportTop ?? 0;
  const viewportLeft = geometry.viewportLeft ?? 0;
  const sheetTopY =
    viewportTop +
    geometry.viewportHeight -
    sheetObscuredHeightFromViewportBottom(
      snap,
      geometry.viewportHeight,
      collapsedHeightPx,
      fullHeightPx,
      halfSnapFraction,
    );

  return {
    top: Math.max(0, geometry.canvasTop - viewportTop),
    left: Math.max(0, geometry.canvasLeft - viewportLeft),
    right: Math.max(
      0,
      viewportLeft + geometry.viewportWidth - geometry.canvasRight,
    ),
    bottom: Math.max(0, geometry.canvasBottom - sheetTopY),
  };
}

/** Visible map bounds in viewport/client pixels (for debug overlays). */
export function visibleClientRectFromScreenGeometry(
  snap: BottomSheetSnap,
  collapsedHeightPx: number,
  fullHeightPx: number,
  geometry: MapCanvasScreenGeometry,
  halfSnapFraction: number = DEFAULT_HALF_SNAP_FRACTION,
): PixelRect {
  const obscured = obscuredInsetsFromScreenGeometry(
    snap,
    collapsedHeightPx,
    fullHeightPx,
    geometry,
    halfSnapFraction,
  );
  const viewportTop = geometry.viewportTop ?? 0;
  const viewportLeft = geometry.viewportLeft ?? 0;
  const x = viewportLeft + obscured.left;
  const y = viewportTop + obscured.top;
  const sheetTopY = geometry.canvasBottom - obscured.bottom;
  const width =
    geometry.canvasRight - geometry.canvasLeft - obscured.left - obscured.right;

  return {
    x,
    y,
    width: Math.max(0, width),
    height: Math.max(0, sheetTopY - y),
  };
}

function readVisualViewportLayout(): Pick<
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

/** Read canvas + viewport geometry from a Mapbox canvas element. */
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

/** Single resolver for visible map bounds, flyTo offset, and whether to move the camera. */
export function resolveMapVisibleViewport(
  canvas: HTMLCanvasElement,
  snap: BottomSheetSnap,
  collapsedHeightPx: number,
  fullHeightPx: number,
  extraObscuredInsets: MapObscuredInsets = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  halfSnapFraction: number = DEFAULT_HALF_SNAP_FRACTION,
): MapVisibleViewport {
  const geometry = readMapCanvasScreenGeometry(canvas);
  const baseRect = visibleClientRectFromScreenGeometry(
    snap,
    collapsedHeightPx,
    fullHeightPx,
    geometry,
    halfSnapFraction,
  );
  const clientRect: PixelRect = {
    x: baseRect.x + (extraObscuredInsets.left ?? 0),
    y: baseRect.y + (extraObscuredInsets.top ?? 0),
    width: Math.max(
      0,
      baseRect.width -
        (extraObscuredInsets.left ?? 0) -
        (extraObscuredInsets.right ?? 0),
    ),
    height: Math.max(
      0,
      baseRect.height -
        (extraObscuredInsets.top ?? 0) -
        (extraObscuredInsets.bottom ?? 0),
    ),
  };
  const hasVisibleArea = clientRect.height > 0 && clientRect.width > 0;

  const canvasRect = canvas.getBoundingClientRect();
  const targetX = clientRect.x + clientRect.width / 2 - canvasRect.left;
  const targetY = clientRect.y + clientRect.height / 2 - canvasRect.top;

  return {
    clientRect,
    centerOffset: {
      x: targetX - canvas.clientWidth / 2,
      y: targetY - canvas.clientHeight / 2,
    },
    hasVisibleArea,
  };
}
