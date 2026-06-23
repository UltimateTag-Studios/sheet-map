import { SheetHost, type Theme } from "@siegetag/sheet";
import type { CSSProperties, ReactNode } from "react";

import { SHEET_HOST_CLASS } from "../viewport/dom/host-classes";

export const MAP_SHELL_CLASS = "sheet-map-shell";
export const MAP_VIEWPORT_CLASS = "sheet-map-viewport";

export type MapFrameProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  theme?: Theme;
};

/** Sized region for map + sheet — snap heights measure from this element. */
export function MapFrame({ children, className, style, theme }: MapFrameProps) {
  const frameClassName = [
    SHEET_HOST_CLASS,
    MAP_SHELL_CLASS,
    MAP_VIEWPORT_CLASS,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <SheetHost className={frameClassName} style={style} theme={theme}>
      {children}
    </SheetHost>
  );
}
