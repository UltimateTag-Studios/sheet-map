import { mergeSheetLayout, type SheetLayoutConfig } from "@siegetag/sheet";

/** Map default list/header spacing — apps override via `config.sheetLayout`. */
export const defaultMapSheetLayout: SheetLayoutConfig = {
  header: { paddingHorizontal: "1rem" },
  body: {
    paddingHorizontal: "1rem",
    paddingVertical: "1rem",
    gap: "0.75rem",
  },
  listItem: {
    gap: "0.5rem",
    paddingHorizontal: "0.75rem",
    paddingVertical: "0.75rem",
    borderRadius: "0.5rem",
    contentGap: "0.125rem",
  },
};

export function resolveMapSheetLayout(
  overrides: SheetLayoutConfig = {},
): SheetLayoutConfig {
  return mergeSheetLayout(defaultMapSheetLayout, overrides);
}
