import {
  type MapShellLayout,
  mergeMapShellLayout,
} from "./map-shell-layout-vars";

/** Map default overlay insets — apps override via `config.layout`. */
export const defaultMapShellLayout: MapShellLayout = {
  actionButton: { top: "0.75rem", right: "0.75rem", padding: "0.25rem" },
  myLocation: { bottom: "0.75rem", left: "0.75rem", size: "2.5rem" },
};

export function resolveMapShellLayout(
  overrides: MapShellLayout = {},
): MapShellLayout {
  return mergeMapShellLayout(defaultMapShellLayout, overrides);
}
