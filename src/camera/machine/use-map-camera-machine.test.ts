import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMapCameraMachine } from "./use-map-camera-machine";

describe("useMapCameraMachine", () => {
  it("dispatches events and runs effects", () => {
    const runEffect = vi.fn();

    const { result } = renderHook(() => useMapCameraMachine(runEffect));

    act(() => {
      result.current.dispatch({
        type: "navigateRequested",
        position: { lat: 1, lng: 2 },
        mode: "fly",
        preserveTracking: false,
      });
    });

    expect(result.current.state.session).toBe("flying");
    expect(runEffect).toHaveBeenCalledWith({
      type: "releaseTracking",
    });
    expect(runEffect).toHaveBeenCalledWith({
      type: "moveCamera",
      position: { lat: 1, lng: 2 },
      duration: 600,
    });
  });
});
