import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SheetMapPeekSpacers } from "./peek-spacers";

describe("SheetMapPeekSpacers", () => {
  it("always renders handle spacer", () => {
    const { container } = render(<SheetMapPeekSpacers />);
    expect(container.querySelector(".sheet-map-handle-spacer")).toBeTruthy();
    expect(container.querySelector(".sheet-map-tab-bar-spacer")).toBeNull();
  });

  it("renders tab bar spacer when reserveTabBar is true", () => {
    const { container } = render(<SheetMapPeekSpacers reserveTabBar />);
    expect(container.querySelector(".sheet-map-tab-bar-spacer")).toBeTruthy();
  });
});
