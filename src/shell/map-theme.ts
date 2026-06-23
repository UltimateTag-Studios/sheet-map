import { DEFAULT_THEME, type Theme } from "@siegetag/sheet";

export type { Theme };

export { DEFAULT_THEME };

export const SHEET_MAP_THEME_ATTR = "data-sheet-map-theme";

export const MAPBOX_STYLE_URL_BY_THEME: Record<Theme, string> = {
  light: "mapbox://styles/mapbox/light-v11",
  dark: "mapbox://styles/mapbox/dark-v11",
};

export function resolveMapboxStyleUrl(theme: Theme = DEFAULT_THEME): string {
  return MAPBOX_STYLE_URL_BY_THEME[theme];
}
