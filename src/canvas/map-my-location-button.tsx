import { useTouchClickActivation } from "../gesture/use-touch-click-activation";
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

/** Google Maps–style floating control to recenter on the user location. */
export function MapMyLocationButton({
  ariaLabel,
  onPress,
  focused = false,
  positioned = false,
  className = "",
}: MapMyLocationButtonProps) {
  const touchActivation = useTouchClickActivation(onPress);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={focused}
      {...touchActivation}
      className={`sheet-map-my-location-button${positioned ? " sheet-map-my-location-button--positioned" : ""}${className ? ` ${className}` : ""}`}
    >
      <MyLocationIcon size={22} />
    </button>
  );
}
