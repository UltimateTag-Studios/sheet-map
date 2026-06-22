import {
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  useMemo,
  useRef,
} from "react";

export type TouchClickActivationHandlers = {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: () => void;
  onClick: (event: MouseEvent<HTMLElement>) => void;
};

function isTouchPointerClick(event: MouseEvent<HTMLElement>): boolean {
  return (
    event.nativeEvent instanceof PointerEvent &&
    event.nativeEvent.pointerType === "touch"
  );
}

/** Pointer handlers for map overlay controls that must respond on the first Android touch tap. */
export function useTouchClickActivation(
  onActivate: () => void,
): TouchClickActivationHandlers {
  const onActivateRef = useRef(onActivate);
  onActivateRef.current = onActivate;
  const touchTapRef = useRef(false);

  return useMemo(
    () => ({
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
        if (event.pointerType === "touch" && event.button === 0) {
          touchTapRef.current = true;
        }
      },
      onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
        if (
          event.pointerType !== "touch" ||
          event.button !== 0 ||
          !touchTapRef.current
        ) {
          return;
        }

        touchTapRef.current = false;
        requestAnimationFrame(() => {
          onActivateRef.current();
        });
      },
      onPointerCancel: () => {
        touchTapRef.current = false;
      },
      onClick: (event: MouseEvent<HTMLElement>) => {
        if (isTouchPointerClick(event)) {
          return;
        }
        onActivateRef.current();
      },
    }),
    [],
  );
}
