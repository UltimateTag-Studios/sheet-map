import { useTouchClickActivation } from "../gesture/use-touch-click-activation";
import { CloseIcon } from "../icons/close-icon";

export type MapDismissSelectionButtonProps = {
  ariaLabel: string;
  onPress: () => void;
  /** Pin to top-right of `.sheet-map-visible-area` (map overlay). */
  positioned?: boolean;
  className?: string;
};

export function MapDismissSelectionButton({
  ariaLabel,
  onPress,
  positioned = false,
  className = "",
}: MapDismissSelectionButtonProps) {
  const touchActivation = useTouchClickActivation(onPress);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      {...touchActivation}
      className={`sheet-map-dismiss-selection-button${positioned ? " sheet-map-dismiss-selection-button--positioned" : ""}${className ? ` ${className}` : ""}`}
    >
      <CloseIcon size={28} />
    </button>
  );
}
