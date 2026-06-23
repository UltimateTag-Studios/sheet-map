import { describe, expect, it } from "vitest";

import {
  buildMapShellLayoutVars,
  mergeMapShellLayout,
} from "./map-shell-layout-vars";

const defaultLayoutVars = {
  "--sheet-map-action-top": "0.75rem",
  "--sheet-map-action-right": "0.75rem",
  "--sheet-map-action-padding": "0.25rem",
  "--sheet-map-location-button-bottom": "0.75rem",
  "--sheet-map-location-button-left": "0.75rem",
  "--sheet-map-location-button-size": "2.5rem",
  "--sheet-map-location-button-border-radius": "9999px",
  "--sheet-map-location-marker-size": "12px",
  "--sheet-map-location-marker-hit-size": "32px",
  "--sheet-map-item-marker-size": "14px",
  "--sheet-map-item-marker-hit-size": "32px",
  "--sheet-map-item-marker-border-width": "2px",
  "--sheet-map-logo-right": "0.75rem",
  "--sheet-map-logo-bottom": "0",
};

describe("buildMapShellLayoutVars", () => {
  it("defaults action button to top-right without left/bottom vars", () => {
    expect(buildMapShellLayoutVars()).toEqual(defaultLayoutVars);
  });

  it("accepts custom overlay geometry", () => {
    expect(
      buildMapShellLayoutVars({
        actionButton: { top: "1rem", left: 20, padding: "0.5rem" },
        location: { button: { bottom: "1.25rem", left: 16, size: 48 } },
      }),
    ).toEqual({
      "--sheet-map-action-top": "1rem",
      "--sheet-map-action-left": "20px",
      "--sheet-map-action-padding": "0.5rem",
      "--sheet-map-location-button-bottom": "1.25rem",
      "--sheet-map-location-button-left": "16px",
      "--sheet-map-location-button-size": "48px",
      "--sheet-map-location-button-border-radius": "9999px",
      "--sheet-map-location-marker-size": "12px",
      "--sheet-map-location-marker-hit-size": "32px",
      "--sheet-map-item-marker-size": "14px",
      "--sheet-map-item-marker-hit-size": "32px",
      "--sheet-map-item-marker-border-width": "2px",
      "--sheet-map-logo-right": "0.75rem",
      "--sheet-map-logo-bottom": "0",
    });
  });
});

describe("mergeMapShellLayout", () => {
  it("deep-merges overlay sections", () => {
    expect(
      mergeMapShellLayout(
        { actionButton: { top: "0.75rem", right: "0.75rem" } },
        { location: { button: { size: "3rem" } } },
      ),
    ).toEqual({
      actionButton: { top: "0.75rem", right: "0.75rem" },
      location: { button: { size: "3rem" } },
    });
  });
});
