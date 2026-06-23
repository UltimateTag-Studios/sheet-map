import { mergeSheetLayout, type SheetLayout } from "@siegetag/sheet";

/** Map default list/header spacing — apps override via `config.sheetLayout`. */
export const defaultMapSheetLayout: SheetLayout = {
  header: { paddingHorizontal: "1rem" },
  body: {
    paddingHorizontal: "1rem",
    paddingVertical: "1rem",
    gap: "0.75rem",
  },
  listItem: { gap: "0.5rem" },
};

export function resolveMapSheetLayout(
  overrides: SheetLayout = {},
): SheetLayout {
  return mergeSheetLayout(defaultMapSheetLayout, overrides);
}
