import { SHEET_CLASS } from "../dom/host-classes";

export type ViewportObserverCleanup = () => void;

export function attachViewportObservers(
  canvas: HTMLCanvasElement,
  host: Element | null,
  onSync: () => void,
): ViewportObserverCleanup {
  const canvasObserver = new ResizeObserver(onSync);
  canvasObserver.observe(canvas);

  let sheetObserver: ResizeObserver | undefined;
  let hostMutationObserver: MutationObserver | undefined;

  const observeSheet = () => {
    const sheet = host?.querySelector(`.${SHEET_CLASS}`);
    if (!sheet || sheetObserver) {
      return;
    }

    sheetObserver = new ResizeObserver(onSync);
    sheetObserver.observe(sheet);
    onSync();
  };

  if (host) {
    observeSheet();

    if (!host.querySelector(`.${SHEET_CLASS}`)) {
      hostMutationObserver = new MutationObserver(() => {
        observeSheet();
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
    sheetObserver?.disconnect();
    hostMutationObserver?.disconnect();
    window.removeEventListener("resize", onSync);
    visualViewport?.removeEventListener("resize", onSync);
    visualViewport?.removeEventListener("scroll", onSync);
  };
}
