import { describe, expect, it } from "vitest";

import type { MapShellSlots } from "./config";

describe("MapShellSlots", () => {
  it("renderMyLocationButton receives disabled as the fourth argument", () => {
    const calls: boolean[] = [];
    const slot: NonNullable<MapShellSlots["renderMyLocationButton"]> = (
      _onPress,
      _tracking,
      _ariaLabel,
      disabled,
    ) => {
      calls.push(disabled);
      return null;
    };

    slot(() => {}, true, "Focus my location", true);
    slot(() => {}, false, "Focus my location", false);

    expect(calls).toEqual([true, false]);
  });
});
