/** Rebuild-in-progress marker for demo + CI. Bump when a phase lands. */
export const SHEET_MAP_REBUILD_PHASE = 3 as const;

export {
  MAP_CANVAS_ROOT_CLASS,
  MapCanvas,
  type MapCanvasProps,
  MapInstanceProvider,
  MapInstancePublisherLayer,
  type PublishMapInstance,
  resolveMapRef,
} from "./canvas";
export {
  MAP_SHELL_CLASS,
  MAP_VIEWPORT_CLASS,
  type MapBottomChromeReserve,
  MapFrame,
  type MapFrameProps,
  MapSheetLayout,
  type MapSheetLayoutProps,
} from "./shell";
export {
  areMapViewportsEqual,
  type MapCanvasScreenGeometry,
  type MapObscuredInsets,
  type MapViewportSyncState,
  MapVisibleAreaDebug,
  type MapVisibleAreaDebugProps,
  type MapVisibleViewport,
  obscuredInsetsFromScreenGeometry,
  type PixelPoint,
  type PixelRect,
  type PixelSize,
  type ResolveMapVisibleViewportOptions,
  readLiveSheetObscuredBottomPx,
  readMapCanvasScreenGeometry,
  readSheetHost,
  resolveMapVisibleViewport,
  SHEET_HOST_CLASS,
  SHEET_SLIDE_CLASS,
  type SheetSnapHeightsPx,
  type UseMapVisibleViewportSyncOptions,
  type UseVisibleViewportSyncOptions,
  useMapVisibleViewportSync,
  useVisibleViewportSync,
  visibleClientRectFromLiveSheetObscured,
  visibleClientRectFromScreenGeometry,
  visibleViewboxCenter,
} from "./viewport";
