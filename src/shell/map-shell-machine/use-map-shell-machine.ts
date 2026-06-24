import { useCallback, useRef, useState } from "react";

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

export function useMapShellMachine(
  onEffect: (effect: MapShellMachineEffect) => void,
): {
  state: MapShellMachineState;
  dispatch: MapShellMachineDispatch;
} {
  const onEffectRef = useRef(onEffect);
  onEffectRef.current = onEffect;

  const stateRef = useRef(createInitialMapShellMachineState());
  const [state, setState] = useState(createInitialMapShellMachineState);

  const dispatch = useCallback((event: MapShellMachineEvent) => {
    const result = reduceMapShellMachine(stateRef.current, event);
    stateRef.current = result.state;
    setState(result.state);
    for (const effect of result.effects) {
      onEffectRef.current(effect);
    }
  }, []);

  return { state, dispatch };
}
