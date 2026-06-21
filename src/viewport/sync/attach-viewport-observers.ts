import { SHEET_SLIDE_CLASS } from "../dom/host-classes";

export type ViewportObserverCleanup = () => void;

export function attachViewportObservers(
  canvas: HTMLCanvasElement,
  host: Element | null,
  onSync: () => void,
): ViewportObserverCleanup {
  const canvasObserver = new ResizeObserver(onSync);
  canvasObserver.observe(canvas);

  let sheetSlideObserver: ResizeObserver | undefined;
  let hostMutationObserver: MutationObserver | undefined;

  const observeSheetSlide = () => {
    const sheetSlide = host?.querySelector(`.${SHEET_SLIDE_CLASS}`);
    if (!sheetSlide || sheetSlideObserver) {
      return;
    }

    sheetSlideObserver = new ResizeObserver(onSync);
    sheetSlideObserver.observe(sheetSlide);
    onSync();
  };

  if (host) {
    observeSheetSlide();

    if (!host.querySelector(`.${SHEET_SLIDE_CLASS}`)) {
      hostMutationObserver = new MutationObserver(() => {
        observeSheetSlide();
        onSync();
      });
      hostMutationObserver.observe(host, {
        childList: true,
        subtree: true,
      });
    }
  }

  window.addEventListener("resize", onSync);
  const visualViewport = window.visualViewport;
  visualViewport?.addEventListener("resize", onSync);
  visualViewport?.addEventListener("scroll", onSync);

  return () => {
    canvasObserver.disconnect();
    sheetSlideObserver?.disconnect();
    hostMutationObserver?.disconnect();
    window.removeEventListener("resize", onSync);
    visualViewport?.removeEventListener("resize", onSync);
    visualViewport?.removeEventListener("scroll", onSync);
  };
}
