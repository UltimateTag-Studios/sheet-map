import { CloseIcon } from "@siegetag/ui";

import { useTouchClickActivation } from "../gesture/use-touch-click-activation";

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
  const touchActivation = useTouchClickActivation(onPress);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      {...touchActivation}
      className={`sheet-map-action-button${className ? ` ${className}` : ""}`}
    >
      <CloseIcon size={28} />
    </button>
  );
}
