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
      className={`pointer-events-auto flex size-10 items-center justify-center rounded-full border shadow-[0_1px_4px_rgba(0,0,0,0.35)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
        focused
          ? "border-[#1a73e8] bg-[#1a73e8] text-white hover:bg-[#1558b0]"
          : "border-white/20 bg-neutral-900/90 text-neutral-300 hover:bg-neutral-800/90"
      } ${className}`.trim()}
    >
      <MyLocationIcon size={22} />
    </button>
  );
}
