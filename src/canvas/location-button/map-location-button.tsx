import { useTouchClickActivation } from "../../gesture/use-touch-click-activation";
import { MyLocationIcon } from "./my-location-icon";

export type MapLocationButtonProps = {
  ariaLabel: string;
  onPress: () => void;
  /** Blue when actively tracking the user location. */
  tracking?: boolean;
  className?: string;
};

/** Google Maps–style floating control to recenter on the user location. */
export function MapLocationButton({
  ariaLabel,
  onPress,
  tracking = false,
  className = "",
}: MapLocationButtonProps) {
  const touchActivation = useTouchClickActivation(onPress);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={tracking}
      {...touchActivation}
      className={`sheet-map-location-button${className ? ` ${className}` : ""}`}
    >
      <MyLocationIcon size={22} />
    </button>
  );
}
