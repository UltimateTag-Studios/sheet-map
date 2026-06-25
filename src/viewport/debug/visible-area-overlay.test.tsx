import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MapVisibleAreaOverlay } from "./visible-area-overlay";

const rect = { x: 0, y: 0, width: 400, height: 300 };

describe("MapVisibleAreaOverlay", () => {
  it("renders nothing when clientRect has never been set", () => {
    const { container } = render(
      <MapVisibleAreaOverlay clientRect={null}>
        <button type="button">Locate</button>
      </MapVisibleAreaOverlay>,
    );

    expect(container.firstChild).toBeNull();
  });

  it("fades out instead of unmounting immediately when clientRect clears", () => {
    const { rerender } = render(
      <MapVisibleAreaOverlay clientRect={rect}>
        <button type="button">Locate</button>
      </MapVisibleAreaOverlay>,
    );

    const overlay = screen
      .getByRole("button", { name: "Locate" })
      .closest(".sheet-map-visible-area-overlay");
    expect(overlay).toBeTruthy();
    if (!overlay) {
      return;
    }
    expect(
      overlay.classList.contains("sheet-map-visible-area-overlay--shown"),
    ).toBe(true);

    rerender(
      <MapVisibleAreaOverlay clientRect={null}>
        <button type="button">Locate</button>
      </MapVisibleAreaOverlay>,
    );

    expect(
      overlay.classList.contains("sheet-map-visible-area-overlay--shown"),
    ).toBe(false);

    act(() => {
      overlay.dispatchEvent(
        new TransitionEvent("transitionend", {
          propertyName: "opacity",
          bubbles: true,
        }),
      );
    });

    expect(screen.queryByRole("button", { name: "Locate" })).toBeNull();
  });
});
