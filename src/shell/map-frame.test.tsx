import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SHEET_HOST_CLASS } from "../viewport/dom/host-classes";
import { MAP_SHELL_CLASS, MAP_VIEWPORT_CLASS, MapFrame } from "./map-frame";

describe("MapFrame", () => {
  it("renders children in a sheet host with map shell classes", () => {
    render(
      <MapFrame className="demo-host">
        <span>map stage</span>
      </MapFrame>,
    );

    expect(screen.getByText("map stage")).toBeTruthy();

    const host = document.querySelector(
      `.${SHEET_HOST_CLASS}.${MAP_SHELL_CLASS}.${MAP_VIEWPORT_CLASS}.demo-host`,
    );
    expect(host).toBeTruthy();
  });
});
