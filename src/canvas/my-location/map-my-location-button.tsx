import { useTouchClickActivation } from "../../gesture/use-touch-click-activation";
import { MyLocationIcon } from "./my-location-icon";

export type MapMyLocationButtonProps = {
  ariaLabel: string;
  onPress: () => void;
  /** Blue when actively tracking the user location. */
  tracking?: boolean;
  className?: string;
};

/** Google Maps–style floating control to recenter on the user location. */
export function MapMyLocationButton({
  ariaLabel,
  onPress,
  tracking = false,
  className = "",
}: MapMyLocationButtonProps) {
  const touchActivation = useTouchClickActivation(onPress);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={tracking}
      {...touchActivation}
      className={`sheet-map-my-location-button${className ? ` ${className}` : ""}`}
    >
      <MyLocationIcon size={22} />
    </button>
  );
}
