import type { CSSProperties } from "react";

import type { MapShellConfig } from "./config";

export const DEFAULT_PEEK_BALANCE_ADJUST_PX = -7;

export function buildSheetMapDrawerCssVars(
  config: Pick<
    MapShellConfig,
    "peekBalanceAdjustPx" | "peekPaddingY" | "collapsedBottomInsetPx"
  >,
): CSSProperties {
  const vars: Record<string, string> = {
    "--sheet-map-peek-balance-adjust": `${config.peekBalanceAdjustPx ?? DEFAULT_PEEK_BALANCE_ADJUST_PX}px`,
  };

  if (config.peekPaddingY !== undefined) {
    vars["--sheet-map-peek-padding-y"] =
      typeof config.peekPaddingY === "number"
        ? `${config.peekPaddingY}px`
        : config.peekPaddingY;
  }

  return vars as CSSProperties;
}
