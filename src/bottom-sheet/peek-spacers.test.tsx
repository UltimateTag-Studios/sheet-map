import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SheetMapHandleSpacer } from "./peek-spacers";

describe("SheetMapHandleSpacer", () => {
  it("renders handle spacer", () => {
    const { container } = render(<SheetMapHandleSpacer />);
    expect(container.querySelector(".sheet-map-handle-spacer")).toBeTruthy();
  });
});
