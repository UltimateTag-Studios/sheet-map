import { CloseIcon } from "@siegetag/ui";

import { useTouchClickActivation } from "../gesture/use-touch-click-activation";

export type MapCloseSheetButtonProps = {
  ariaLabel: string;
  onPress: () => void;
  className?: string;
};

/** Default close control for the visible-map top-right slot when the sheet is open. */
export function MapCloseSheetButton({
  ariaLabel,
  onPress,
  className = "",
}: MapCloseSheetButtonProps) {
  const touchActivation = useTouchClickActivation(onPress);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      {...touchActivation}
      className={`sheet-map-close-sheet-button${className ? ` ${className}` : ""}`}
    >
      <CloseIcon size={28} />
    </button>
  );
}
