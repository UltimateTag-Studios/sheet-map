import { useCallback, useRef, useState } from "react";

import type { MapItemLocation } from "../../items/types";
import { type MapShellMachineEvent, reduceMapShellMachine } from "./machine";
import type { MapShellEnvironment } from "./state";
import {
  createInitialMapShellMachineState,
  type MapShellMachineState,
} from "./state";

export type MapShellMachineDispatch = (event: MapShellMachineEvent) => void;

export function useMapShellMachine(
  onFlyToItem: (location: MapItemLocation) => void,
  readEnvironment: () => MapShellEnvironment,
): {
  state: MapShellMachineState;
  dispatch: MapShellMachineDispatch;
} {
  const onFlyToItemRef = useRef(onFlyToItem);
  onFlyToItemRef.current = onFlyToItem;

  const readEnvironmentRef = useRef(readEnvironment);
  readEnvironmentRef.current = readEnvironment;

  const stateRef = useRef(createInitialMapShellMachineState());
  const [state, setState] = useState(createInitialMapShellMachineState);

  const syncEnvironment = useCallback(() => {
    const result = reduceMapShellMachine(stateRef.current, {
      type: "environmentSynced",
      environment: readEnvironmentRef.current(),
    });
    stateRef.current = result.state;
    setState(result.state);
  }, []);

  const dispatch = useCallback(
    (event: MapShellMachineEvent) => {
      const result = reduceMapShellMachine(stateRef.current, event);
      stateRef.current = result.state;
      setState(result.state);

      for (const effect of result.effects) {
        if (effect.type !== "flyToItem") {
          continue;
        }

        onFlyToItemRef.current(effect.location);
        syncEnvironment();
        queueMicrotask(syncEnvironment);
      }
    },
    [syncEnvironment],
  );

  return { state, dispatch };
}
