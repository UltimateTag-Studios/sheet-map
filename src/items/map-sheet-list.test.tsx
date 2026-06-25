import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
  shell: Pick<MapShellState, "selectedItemId" | "selectItem">,
) {
  const { routeContentStore } = createTestMapRouteStores();

  return render(
    <MapRouteProvider
      shell={shell as unknown as MapShellState}
      routeContentStore={routeContentStore}
    >
      <MapShellSlotsProvider slots={{}}>
        <MapSheetList items={items} />
      </MapShellSlotsProvider>
    </MapRouteProvider>,
  );
}

describe("MapSheetList", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders default rows and calls selectItem on press", () => {
    const selectItem = vi.fn();

    mountList({
      selectedItemId: null,
      selectItem,
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
    });

    const betaButton = screen.getByRole("button", { name: "Beta" });
    expect(betaButton.getAttribute("aria-pressed")).toBe("true");
  });

  it("uses renderSheetListItem slot when provided", () => {
    const { routeContentStore } = createTestMapRouteStores();

    render(
      <MapRouteProvider
        shell={
          {
            selectedItemId: null,
            selectItem: vi.fn(),
          } as unknown as MapShellState
        }
        routeContentStore={routeContentStore}
      >
        <MapShellSlotsProvider
          slots={{
            renderSheetListItem: (item, selected) => (
              <span data-testid={`slot-${item.id}`}>
                {selected ? "on" : "off"}
              </span>
            ),
          }}
        >
          <MapSheetList items={items} />
        </MapShellSlotsProvider>
      </MapRouteProvider>,
    );

    expect(screen.getByTestId("slot-a").textContent).toBe("off");
    expect(screen.getByTestId("slot-b").textContent).toBe("off");
  });
});
