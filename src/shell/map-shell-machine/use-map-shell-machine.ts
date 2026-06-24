import { useCallback, useRef, useState } from "react";

import type { MapItemLocation } from "../../items/types";
import {
  type MapShellMachineEffect,
  type MapShellMachineEvent,
  reduceMapShellMachine,
} from "./machine";
import {
  createInitialMapShellMachineState,
  type MapShellMachineState,
} from "./state";

export type MapShellMachineDispatch = (event: MapShellMachineEvent) => void;

function applyEffects(
  effects: MapShellMachineEffect[],
  onFlyToItem: (location: MapItemLocation) => void,
) {
  for (const effect of effects) {
    if (effect.type === "flyToItem") {
      onFlyToItem(effect.location);
    }
  }
}

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
    applyEffects(result.effects, (location) =>
      onFlyToItemRef.current(location),
    );
  }, []);

  return { state, dispatch };
}
