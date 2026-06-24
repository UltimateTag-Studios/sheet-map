import type { MapShellMachineResult } from "../types";

export function mergeResults(
  first: MapShellMachineResult,
  second: MapShellMachineResult,
): MapShellMachineResult {
  return {
    state: second.state,
    effects: [...first.effects, ...second.effects],
  };
}
