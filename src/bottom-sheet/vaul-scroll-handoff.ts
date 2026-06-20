import { useCallback, useEffect, useRef } from "react";

export type VaulScrollHandoff = {
  scrollRootRef: (node: HTMLDivElement | null) => void;
};

const SCROLL_TOP_EPSILON_PX = 1;
const VAUL_NO_DRAG_ATTR = "data-vaul-no-drag";

function clampScrollTop(el: HTMLDivElement) {
  if (el.scrollTop < 0) {
    el.scrollTop = 0;
  }
}

/** Toggle Vaul drag gate from scroll position only — never from touchstart defaults. */
export function syncVaulDragGate(el: HTMLDivElement, canBodyScroll: boolean) {
  clampScrollTop(el);

  if (!canBodyScroll) {
    el.removeAttribute(VAUL_NO_DRAG_ATTR);
    if (el.scrollTop > 0) {
      el.scrollTop = 0;
    }
    return;
  }

  if (el.scrollTop > SCROLL_TOP_EPSILON_PX) {
    el.setAttribute(VAUL_NO_DRAG_ATTR, "");
    return;
  }

  el.removeAttribute(VAUL_NO_DRAG_ATTR);
}

/**
 * Body-only scroll + Vaul pull-down at scroll top (Google Maps style mid-drag handoff).
 */
export function useVaulScrollHandoff(
  canBodyScroll: boolean,
): VaulScrollHandoff {
  const scrollElRef = useRef<HTMLDivElement | null>(null);
  const wasCanBodyScrollRef = useRef(canBodyScroll);
  const canBodyScrollRef = useRef(canBodyScroll);
  const cleanupRef = useRef<(() => void) | null>(null);

  canBodyScrollRef.current = canBodyScroll;

  const detachListeners = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  const attachListeners = useCallback(
    (el: HTMLDivElement) => {
      detachListeners();

      const sync = () => {
        syncVaulDragGate(el, canBodyScrollRef.current);
      };

      sync();

      const onScroll = () => {
        sync();
      };

      el.addEventListener("scroll", onScroll, { passive: true });

      cleanupRef.current = () => {
        el.removeEventListener("scroll", onScroll);
        el.removeAttribute(VAUL_NO_DRAG_ATTR);
      };
    },
    [detachListeners],
  );

  const scrollRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      detachListeners();
      scrollElRef.current = node;
      if (node) {
        attachListeners(node);
      }
    },
    [attachListeners, detachListeners],
  );

  useEffect(() => {
    if (scrollElRef.current) {
      syncVaulDragGate(scrollElRef.current, canBodyScroll);
    }
  }, [canBodyScroll]);

  useEffect(() => {
    if (wasCanBodyScrollRef.current && !canBodyScroll) {
      scrollElRef.current?.scrollTo(0, 0);
      scrollElRef.current?.removeAttribute(VAUL_NO_DRAG_ATTR);
    }
    wasCanBodyScrollRef.current = canBodyScroll;
  }, [canBodyScroll]);

  useEffect(() => () => detachListeners(), [detachListeners]);

  return { scrollRootRef };
}
