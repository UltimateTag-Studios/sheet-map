import { CloseIcon } from "@siegetag/ui";

export type MapActionButtonProps = {
  ariaLabel: string;
  onPress: () => void;
  className?: string;
};

/** Default close control for the map action button slot when the sheet is open. */
export function MapActionButton({
  ariaLabel,
  onPress,
  className = "",
}: MapActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onPress}
      className={`sheet-map-action-button${className ? ` ${className}` : ""}`}
    >
      <CloseIcon size={28} />
    </button>
  );
}
