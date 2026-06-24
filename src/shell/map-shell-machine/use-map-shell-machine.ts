import { useCallback, useRef, useState } from "react";

import type { MapItemLocation } from "../../items/types";
import { type MapShellMachineEvent, reduceMapShellMachine } from "./machine";
import {
  createInitialMapShellMachineState,
  type MapShellMachineState,
} from "./state";

export type MapShellMachineDispatch = (event: MapShellMachineEvent) => void;

export function useMapShellMachine(
  onFlyToItem: (location: MapItemLocation) => void,
): {
  state: MapShellMachineState;
  dispatch: MapShellMachineDispatch;
} {
  const onFlyToItemRef = useRef(onFlyToItem);
  onFlyToItemRef.current = onFlyToItem;

  const stateRef = useRef(createInitialMapShellMachineState());
  const [state, setState] = useState(createInitialMapShellMachineState);

  const dispatch = useCallback((event: MapShellMachineEvent) => {
    const result = reduceMapShellMachine(stateRef.current, event);
    stateRef.current = result.state;
    setState(result.state);

    for (const effect of result.effects) {
      if (effect.type === "flyToItem") {
        onFlyToItemRef.current(effect.location);
      }
    }
  }, []);

  return { state, dispatch };
}
