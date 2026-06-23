import { describe, expect, it } from "vitest";

import {
  defaultMapSheetLayout,
  resolveMapSheetLayout,
} from "./resolve-map-sheet-layout";

describe("resolveMapSheetLayout", () => {
  it("applies map defaults for header, body, and list spacing", () => {
    expect(resolveMapSheetLayout()).toEqual(defaultMapSheetLayout);
  });

  it("merges overrides without dropping defaults", () => {
    expect(
      resolveMapSheetLayout({
        handle: { marginTop: "0.5rem" },
        sheet: { borderRadius: "1rem" },
        bottomChromeReserve: { reserve: "82px", gap: "1rem" },
      }),
    ).toEqual({
      handle: { marginTop: "0.5rem" },
      sheet: { borderRadius: "1rem" },
      header: { paddingHorizontal: "1rem" },
      body: {
        paddingHorizontal: "1rem",
        paddingVertical: "1rem",
        gap: "0.75rem",
      },
      listItem: { gap: "0.5rem" },
      bottomChromeReserve: { reserve: "82px", gap: "1rem" },
    });
  });
});
