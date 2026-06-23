import type { CSSProperties, ReactNode } from "react";

import { SHEET_MAP_THEME_ATTR, type Theme } from "./map-theme";

export type MapLayoutRootProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  theme?: Theme;
};

/** Sized wrapper for map layout chrome + routed children. */
export function MapLayoutRoot({
  children,
  className,
  style,
  theme,
}: MapLayoutRootProps) {
  return (
    <div
      className={className}
      style={style}
      {...(theme ? { [SHEET_MAP_THEME_ATTR]: theme } : {})}
    >
      {children}
    </div>
  );
}
