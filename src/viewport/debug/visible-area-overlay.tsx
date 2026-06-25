import type { ReactNode, TransitionEventHandler } from "react";
import { useLayoutEffect, useRef, useState } from "react";

import type { PixelRect } from "../types";

export type MapVisibleAreaOverlayProps = {
  clientRect: PixelRect | null;
  children?: ReactNode;
  className?: string;
};

/** Fixed frame aligned to the computed visible map rect for overlay controls. */
export function MapVisibleAreaOverlay({
  clientRect,
  children,
  className = "",
}: MapVisibleAreaOverlayProps) {
  const [renderRect, setRenderRect] = useState<PixelRect | null>(clientRect);
  const [shown, setShown] = useState(clientRect !== null);
  const wasVisibleRef = useRef(clientRect !== null);

  useLayoutEffect(() => {
    if (clientRect) {
      setRenderRect(clientRect);
      const entering = !wasVisibleRef.current;
      wasVisibleRef.current = true;

      if (entering) {
        setShown(false);
        const frame = requestAnimationFrame(() => {
          setShown(true);
        });
        return () => {
          cancelAnimationFrame(frame);
        };
      }

      setShown(true);
      return;
    }

    wasVisibleRef.current = false;
    setShown(false);
  }, [clientRect]);

  useLayoutEffect(() => {
    if (shown || clientRect || !renderRect) {
      return;
    }

    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setRenderRect(null);
    }
  }, [shown, clientRect, renderRect]);

  const handleTransitionEnd: TransitionEventHandler<HTMLDivElement> = (
    event,
  ) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.propertyName !== "opacity") {
      return;
    }
    if (!shown && clientRect === null) {
      setRenderRect(null);
    }
  };

  if (!renderRect) {
    return null;
  }

  const overlayClassName = [
    "sheet-map-visible-area-overlay",
    shown ? "sheet-map-visible-area-overlay--shown" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={overlayClassName}
      style={{
        left: renderRect.x,
        top: renderRect.y,
        width: renderRect.width,
        height: renderRect.height,
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="sheet-map-visible-area">{children}</div>
    </div>
  );
}
