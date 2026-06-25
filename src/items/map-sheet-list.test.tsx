import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MapShellState } from "../shell/map-route-context";
import { MapRouteProvider } from "../shell/map-route-context";
import { MapShellSlotsProvider } from "../shell/map-shell-slots-context";
import { createTestMapRouteStores } from "../shell/testing/map-route-test-stores";
import { MapSheetList } from "./map-sheet-list";
import type { MapItem } from "./types";

const items: MapItem[] = [
  {
    id: "a",
    location: { lat: 1, lng: 2 },
    title: "Alpha",
    subtitle: "First",
  },
  {
    id: "b",
    location: { lat: 3, lng: 4 },
    title: "Beta",
    meta: "Second",
  },
];

function mountList(
  shell: Pick<MapShellState, "selectedItemId" | "selectItem" | "sheetSnap">,
  slots: Parameters<typeof MapShellSlotsProvider>[0]["slots"] = {},
) {
  const { routeContentStore } = createTestMapRouteStores();

  return render(
    <MapRouteProvider
      shell={shell as unknown as MapShellState}
      routeContentStore={routeContentStore}
    >
      <MapShellSlotsProvider slots={slots}>
        <MapSheetList items={items} />
      </MapShellSlotsProvider>
    </MapRouteProvider>,
  );
}

describe("MapSheetList", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("renders default rows and calls selectItem on press", () => {
    const selectItem = vi.fn();

    mountList({
      selectedItemId: null,
      selectItem,
      sheetSnap: "full",
    });

    expect(screen.getByText("Alpha")).toBeDefined();
    expect(screen.getByText("Beta")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Alpha" }));

    expect(selectItem).toHaveBeenCalledWith("a", { lat: 1, lng: 2 });
  });

  it("marks the selected row", () => {
    mountList({
      selectedItemId: "b",
      selectItem: vi.fn(),
      sheetSnap: "full",
    });

    const betaButton = screen.getByRole("button", { name: "Beta" });
    expect(betaButton.getAttribute("aria-pressed")).toBe("true");
  });

  it("uses renderSheetListItem slot with extended context", () => {
    const selectItem = vi.fn();

    mountList(
      {
        selectedItemId: "b",
        selectItem,
        sheetSnap: "half",
      },
      {
        renderSheetListItem: (item, ctx) => (
          <button
            type="button"
            data-testid={`slot-${item.id}`}
            onClick={ctx.onPress}
          >
            {ctx.selected ? "on" : "off"}:{ctx.sheetSnap}
          </button>
        ),
      },
    );

    expect(screen.getByTestId("slot-b").textContent).toBe("on:half");
    expect(screen.getByTestId("slot-a").textContent).toBe("off:half");

    fireEvent.click(screen.getByTestId("slot-a"));
    expect(selectItem).toHaveBeenCalledWith("a", { lat: 1, lng: 2 });
  });

  it("promotes selected item to the front at half snap", () => {
    mountList(
      {
        selectedItemId: "b",
        selectItem: vi.fn(),
        sheetSnap: "half",
      },
      {
        renderSheetListItem: (item) => (
          <span data-testid={`slot-${item.id}`}>{item.title}</span>
        ),
      },
    );

    const rows = screen.getAllByTestId(/slot-/);
    expect(rows[0]?.textContent).toBe("Beta");
    expect(rows[1]?.textContent).toBe("Alpha");
  });
});
