import { DEFAULT_HALF_SNAP_FRACTION } from "../shell/normalize-half-snap-fraction";

export const FALLBACK_COLLAPSED_HEIGHT_PX = 150;
export const FALLBACK_FULL_HEIGHT_PX = 700;

/** Vaul snap point string for a fixed pixel sheet height. */
export function bottomSheetSnapPointPx(heightPx: number): string {
  return `${Math.round(heightPx)}px`;
}

/** Full sheet height: visual viewport minus top safe area / offset. */
export function readFullHeightPx(): number {
  if (typeof window === "undefined") {
    return FALLBACK_FULL_HEIGHT_PX;
  }

  const viewport = window.visualViewport;
  const viewportHeight =
    viewport && viewport.height > 0 ? viewport.height : window.innerHeight;
  const topInset = viewport?.offsetTop ?? 0;

  const height = Math.max(0, viewportHeight - topInset);
  return height > 0 ? height : FALLBACK_FULL_HEIGHT_PX;
}

/** Height of the handle block (bar + top margin) in CSS pixels. */
export function measureHandleBlockHeightPx(
  handleEl: HTMLElement | null,
): number {
  if (!handleEl) {
    return 0;
  }

  const style = getComputedStyle(handleEl);
  const marginTop = Number.parseFloat(style.marginTop) || 0;
  return handleEl.offsetHeight + marginTop;
}

/** Sum handle + peek DOM heights and optional extra bottom inset. */
export function measureCollapsedHeightPx(
  handleEl: HTMLElement | null,
  peekEl: HTMLElement | null,
  collapsedBottomInsetPx: number,
  fullHeightPx: number = readFullHeightPx(),
  halfSnapFraction: number = DEFAULT_HALF_SNAP_FRACTION,
): number {
  const handleHeight = measureHandleBlockHeightPx(handleEl);
  const peekHeight = peekEl?.offsetHeight ?? 0;
  const total = handleHeight + peekHeight + collapsedBottomInsetPx;

  if (total <= 0) {
    return FALLBACK_COLLAPSED_HEIGHT_PX;
  }

  const maxCollapsedPx = Math.floor(fullHeightPx * halfSnapFraction) - 1;
  return Math.min(
    total,
    Math.max(FALLBACK_COLLAPSED_HEIGHT_PX, maxCollapsedPx),
  );
}
