/** Shell chrome + default Mapbox style pairing. */
export type MapShellTheme = "light" | "dark";

export const MAP_SHELL_THEME_ATTR = "data-sheet-map-theme";

export const DEFAULT_MAP_SHELL_THEME: MapShellTheme = "light";

export const MAPBOX_STYLE_URL_BY_THEME: Record<MapShellTheme, string> = {
  light: "mapbox://styles/mapbox/light-v11",
  dark: "mapbox://styles/mapbox/dark-v11",
};

export function resolveMapboxStyleUrl(
  theme: MapShellTheme = DEFAULT_MAP_SHELL_THEME,
): string {
  return MAPBOX_STYLE_URL_BY_THEME[theme];
}
