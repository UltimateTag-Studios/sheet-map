import { describe, expect, it } from "vitest";

import {
  defaultMapShellLayout,
  resolveMapShellLayout,
} from "./resolve-map-shell-layout";

describe("resolveMapShellLayout", () => {
  it("applies map overlay defaults", () => {
    expect(resolveMapShellLayout()).toEqual(defaultMapShellLayout);
  });

  it("merges overrides without dropping defaults", () => {
    expect(
      resolveMapShellLayout({
        actionButton: { top: "1rem" },
        myLocation: { left: "1rem", size: "3rem" },
      }),
    ).toEqual({
      actionButton: {
        top: "1rem",
        right: "0.75rem",
        padding: "0.25rem",
      },
      myLocation: { bottom: "0.75rem", left: "1rem", size: "3rem" },
    });
  });
});
