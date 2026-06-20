import { MyLocationIcon } from "../icons/my-location-icon";

export type MapMyLocationButtonProps = {
  ariaLabel: string;
  onPress: () => void;
  /** Brighter icon when user location is the active map focus. */
  focused?: boolean;
  className?: string;
};

/** Google Maps–style floating control to recenter on the user location. */
export function MapMyLocationButton({
  ariaLabel,
  onPress,
  focused = false,
  className = "",
}: MapMyLocationButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={focused}
      onClick={onPress}
      className={`sheet-map-my-location-button${className ? ` ${className}` : ""}`}
    >
      <MyLocationIcon size={22} />
    </button>
  );
}
