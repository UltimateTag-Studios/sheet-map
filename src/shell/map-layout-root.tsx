import type { CSSProperties, ReactNode } from "react";

import { MAP_SHELL_THEME_ATTR, type MapShellTheme } from "./map-theme";

export type MapLayoutRootProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  theme?: MapShellTheme;
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
      {...(theme ? { [MAP_SHELL_THEME_ATTR]: theme } : {})}
    >
      {children}
    </div>
  );
}
