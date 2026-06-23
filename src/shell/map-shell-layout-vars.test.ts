import { describe, expect, it } from "vitest";

import {
  buildMapShellLayoutVars,
  mergeMapShellLayout,
} from "./map-shell-layout-vars";

describe("buildMapShellLayoutVars", () => {
  it("defaults action button to top-right without left/bottom vars", () => {
    expect(buildMapShellLayoutVars()).toEqual({
      "--sheet-map-action-top": "0.75rem",
      "--sheet-map-action-right": "0.75rem",
      "--sheet-map-action-padding": "0.25rem",
      "--sheet-map-my-location-bottom": "0.75rem",
      "--sheet-map-my-location-left": "0.75rem",
      "--sheet-map-my-location-size": "2.5rem",
    });
  });

  it("accepts custom overlay geometry", () => {
    expect(
      buildMapShellLayoutVars({
        actionButton: { top: "1rem", left: 20, padding: "0.5rem" },
        myLocation: { bottom: "1.25rem", left: 16, size: 48 },
      }),
    ).toEqual({
      "--sheet-map-action-top": "1rem",
      "--sheet-map-action-left": "20px",
      "--sheet-map-action-padding": "0.5rem",
      "--sheet-map-my-location-bottom": "1.25rem",
      "--sheet-map-my-location-left": "16px",
      "--sheet-map-my-location-size": "48px",
    });
  });
});

describe("mergeMapShellLayout", () => {
  it("deep-merges overlay sections", () => {
    expect(
      mergeMapShellLayout(
        { actionButton: { top: "0.75rem", right: "0.75rem" } },
        { myLocation: { size: "3rem" } },
      ),
    ).toEqual({
      actionButton: { top: "0.75rem", right: "0.75rem" },
      myLocation: { size: "3rem" },
    });
  });
});
