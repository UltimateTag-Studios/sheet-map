import { MyLocationIcon } from "./my-location-icon";

export type MapLocationButtonProps = {
  ariaLabel: string;
  onPress: () => void;
  /** Blue when actively tracking the user location. */
  tracking?: boolean;
  disabled?: boolean;
  className?: string;
};

/** Google Maps–style floating control to recenter on the user location. */
export function MapLocationButton({
  ariaLabel,
  onPress,
  tracking = false,
  disabled = false,
  className = "",
}: MapLocationButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={tracking}
      disabled={disabled}
      onClick={onPress}
      className={`sheet-map-location-button${className ? ` ${className}` : ""}`}
    >
      <MyLocationIcon size={22} />
    </button>
  );
}
