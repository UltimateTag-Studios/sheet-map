import { Sheet } from "@siegetag/sheet";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MapFrame } from "./map-frame";
import { MapSheetLayout } from "./map-sheet-layout";

describe("MapSheetLayout", () => {
  it("renders sheet body and bottom chrome reserve spacer", () => {
    render(
      <MapFrame>
        <Sheet defaultSnap="collapsed">
          <MapSheetLayout
            header={<h2>Header</h2>}
            body={<p>Sheet body</p>}
            bottomChromeReserve={{
              reserve: "82px",
              floatGap: "1rem",
            }}
          />
        </Sheet>
      </MapFrame>,
    );

    expect(screen.getByText("Header")).toBeTruthy();
    expect(screen.getByText("Sheet body")).toBeTruthy();

    const reserve = document.querySelector(".sheet-bottom-reserve");
    expect(reserve).toBeTruthy();
    expect(reserve?.getAttribute("style")).toContain("82px");
  });
});
