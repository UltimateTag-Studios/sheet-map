import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createMapInstanceStore } from "./map-instance-store";
import { useMapShell } from "./use-map-shell";

describe("useMapShell", () => {
  it("tracks sheet snap and selection", () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
        userLocation: null,
      }),
    );

    expect(result.current.sheetSnap).toBe("collapsed");
    expect(result.current.selectedItemId).toBeNull();

    act(() => {
      result.current.selectItem("a", { lat: 1, lng: 2 });
    });

    expect(result.current.selectedItemId).toBe("a");
    expect(result.current.sheetSnap).toBe("half");

    act(() => {
      result.current.handleSheetSnapSettled("collapsed");
    });

    expect(result.current.selectedItemId).toBeNull();
  });

  it("clears selection when recentering on user", () => {
    const mapInstanceStore = createMapInstanceStore();
    const { result } = renderHook(() =>
      useMapShell({
        mapInstanceStore,
        accessToken: "token",
        userLocation: { lat: 10, lng: 20 },
      }),
    );

    act(() => {
      result.current.selectItem("a", null);
    });

    expect(result.current.selectedItemId).toBe("a");

    act(() => {
      result.current.recenterOnUser();
    });

    expect(result.current.selectedItemId).toBeNull();
  });
});
