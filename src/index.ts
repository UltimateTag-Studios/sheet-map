/** Rebuild-in-progress marker for demo + CI. Bump when a phase lands. */
export const SHEET_MAP_REBUILD_PHASE = 1 as const;

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
  type UseVisibleViewportSyncOptions,
  useVisibleViewportSync,
  visibleClientRectFromLiveSheetObscured,
  visibleClientRectFromScreenGeometry,
  visibleViewboxCenter,
} from "./viewport";
