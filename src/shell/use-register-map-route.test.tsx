import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createMapRouteContentStore } from "./map-route-content-store";
import type { MapRouteContent, MapShellState } from "./map-route-context";
import { MapRouteProvider } from "./map-route-context";
import { useRegisterMapRoute } from "./use-register-map-route";

const shellStub = {} as MapShellState;

const baseContent: MapRouteContent = {
  mapLayers: null,
  header: "header",
  body: "body",
  isUserLocationFocused: false,
  onUserLocationPress: vi.fn(),
};

function mountRegisterRoute(initialContent: MapRouteContent) {
  const routeContentStore = createMapRouteContentStore();
  let content = initialContent;

  function Harness() {
    useRegisterMapRoute(content);
    return null;
  }

  const view = render(
    <MapRouteProvider shell={shellStub} routeContentStore={routeContentStore}>
      <Harness />
    </MapRouteProvider>,
  );

  return {
    routeContentStore,
    updateContent(next: MapRouteContent) {
      content = next;
      view.rerender(
        <MapRouteProvider
          shell={shellStub}
          routeContentStore={routeContentStore}
        >
          <Harness />
        </MapRouteProvider>,
      );
    },
    unmount() {
      view.unmount();
    },
  };
}

describe("useRegisterMapRoute", () => {
  it("publishes route content to the store on mount", () => {
    const harness = mountRegisterRoute(baseContent);

    expect(harness.routeContentStore.getContent()).toBe(baseContent);

    harness.unmount();
  });

  it("updates the store when route content changes", () => {
    const harness = mountRegisterRoute(baseContent);
    const nextContent: MapRouteContent = {
      ...baseContent,
      header: "next-header",
    };

    harness.updateContent(nextContent);

    expect(harness.routeContentStore.getContent()).toBe(nextContent);

    harness.unmount();
  });

  it("clears the store on unmount", () => {
    const harness = mountRegisterRoute(baseContent);

    harness.unmount();

    expect(harness.routeContentStore.getContent()).toBeNull();
  });

  it("notifies subscribers when content is registered", () => {
    const routeContentStore = createMapRouteContentStore();
    const listener = vi.fn();

    const unsubscribe = routeContentStore.subscribe(listener);

    function Harness() {
      useRegisterMapRoute(baseContent);
      return null;
    }

    render(
      <MapRouteProvider shell={shellStub} routeContentStore={routeContentStore}>
        <Harness />
      </MapRouteProvider>,
    );

    expect(listener).toHaveBeenCalled();

    unsubscribe();
  });
});
