import { type MouseEvent, useRef } from "react";

import { MyLocationIcon } from "../icons/my-location-icon";

export type MapMyLocationButtonProps = {
  ariaLabel: string;
  onPress: () => void;
  /** Brighter icon when user location is the active map focus. */
  focused?: boolean;
  /** Pin to bottom-left of `.sheet-map-visible-area` (map overlay). */
  positioned?: boolean;
  className?: string;
};

function isTouchPointerEvent(event: MouseEvent<HTMLButtonElement>): boolean {
  return (
    event.nativeEvent instanceof PointerEvent &&
    event.nativeEvent.pointerType === "touch"
  );
}

/** Google Maps–style floating control to recenter on the user location. */
export function MapMyLocationButton({
  ariaLabel,
  onPress,
  focused = false,
  positioned = false,
  className = "",
}: MapMyLocationButtonProps) {
  const touchTapRef = useRef(false);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={focused}
      onPointerDown={(event) => {
        if (event.pointerType === "touch" && event.button === 0) {
          touchTapRef.current = true;
        }
      }}
      onPointerUp={(event) => {
        if (
          event.pointerType !== "touch" ||
          event.button !== 0 ||
          !touchTapRef.current
        ) {
          return;
        }

        touchTapRef.current = false;
        // Android often skips click after sheet drags; mirror sheet body activation.
        requestAnimationFrame(() => {
          onPress();
        });
      }}
      onPointerCancel={() => {
        touchTapRef.current = false;
      }}
      onClick={(event) => {
        if (isTouchPointerEvent(event)) {
          return;
        }
        onPress();
      }}
      className={`sheet-map-my-location-button${positioned ? " sheet-map-my-location-button--positioned" : ""}${className ? ` ${className}` : ""}`}
    >
      <MyLocationIcon size={22} />
    </button>
  );
}
