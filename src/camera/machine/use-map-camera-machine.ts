import { type RefObject, useCallback, useRef, useState } from "react";

import {
  type MapCameraMachineEffect,
  type MapCameraMachineEvent,
  type MapCameraMachineResult,
  reduceMapCameraMachine,
} from "./machine";
import {
  type CreateMapCameraMachineStateInput,
  createInitialMapCameraMachineState,
  type MapCameraState,
} from "./state";

export type MapCameraMachineDispatch = (event: MapCameraMachineEvent) => void;

export type MapCameraEffectRunner = (effect: MapCameraMachineEffect) => void;

function applyEffects(
  effects: MapCameraMachineEffect[],
  runEffect: MapCameraEffectRunner,
) {
  for (const effect of effects) {
    runEffect(effect);
  }
}

export function useMapCameraMachine(
  runEffect: MapCameraEffectRunner,
  initialState: CreateMapCameraMachineStateInput = {},
): {
  state: MapCameraState;
  stateRef: React.RefObject<MapCameraState>;
  dispatch: MapCameraMachineDispatch;
} {
  const runEffectRef = useRef(runEffect);
  runEffectRef.current = runEffect;

  const stateRef = useRef(createInitialMapCameraMachineState(initialState));
  const [state, setState] = useState(() =>
    createInitialMapCameraMachineState(initialState),
  );

  const dispatch = useCallback((event: MapCameraMachineEvent) => {
    const result: MapCameraMachineResult = reduceMapCameraMachine(
      stateRef.current,
      event,
    );
    stateRef.current = result.state;
    setState(result.state);
    applyEffects(result.effects, (effect) => runEffectRef.current(effect));
  }, []);

  return { state, stateRef: stateRef as RefObject<MapCameraState>, dispatch };
}
