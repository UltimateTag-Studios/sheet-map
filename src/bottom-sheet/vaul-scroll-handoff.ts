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

/** Vaul: block sheet drag while inner content is scrolled (`data-vaul-no-drag`). */
function syncVaulDragGate(el: HTMLDivElement) {
  clampScrollTop(el);
  if (el.scrollTop > SCROLL_TOP_EPSILON_PX) {
    el.setAttribute(VAUL_NO_DRAG_ATTR, "");
    return;
  }
  el.removeAttribute(VAUL_NO_DRAG_ATTR);
}

/**
 * Full-snap unified scroll + Vaul pull-down at scroll top.
 * All listeners are passive — no touchmove preventDefault.
 */
export function useVaulScrollHandoff(
  scrollEnabled: boolean,
): VaulScrollHandoff {
  const scrollElRef = useRef<HTMLDivElement | null>(null);
  const wasScrollEnabledRef = useRef(scrollEnabled);
  const cleanupRef = useRef<(() => void) | null>(null);

  const detachListeners = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  const attachListeners = useCallback(
    (el: HTMLDivElement) => {
      detachListeners();
      syncVaulDragGate(el);

      const onTouchStart = () => {
        syncVaulDragGate(el);
      };

      const onTouchMove = () => {
        if (el.scrollTop <= SCROLL_TOP_EPSILON_PX) {
          syncVaulDragGate(el);
        }
      };

      const onScroll = () => {
        syncVaulDragGate(el);
      };

      el.addEventListener("touchstart", onTouchStart, { passive: true });
      el.addEventListener("touchmove", onTouchMove, { passive: true });
      el.addEventListener("scroll", onScroll, { passive: true });

      cleanupRef.current = () => {
        el.removeEventListener("touchstart", onTouchStart);
        el.removeEventListener("touchmove", onTouchMove);
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
      if (node && scrollEnabled) {
        attachListeners(node);
      }
    },
    [scrollEnabled, attachListeners, detachListeners],
  );

  useEffect(() => {
    if (wasScrollEnabledRef.current && !scrollEnabled) {
      scrollElRef.current?.scrollTo(0, 0);
      scrollElRef.current?.removeAttribute(VAUL_NO_DRAG_ATTR);
    }
    wasScrollEnabledRef.current = scrollEnabled;
  }, [scrollEnabled]);

  useEffect(() => () => detachListeners(), [detachListeners]);

  return { scrollRootRef };
}
