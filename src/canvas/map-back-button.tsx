import { useTouchClickActivation } from "@siegetag/sheet";

import { BackIcon } from "../icons/back-icon";

export type MapBackButtonProps = {
  ariaLabel: string;
  onPress: () => void;
  className?: string;
};

export function MapBackButton({
  ariaLabel,
  onPress,
  className = "",
}: MapBackButtonProps) {
  const touchActivation = useTouchClickActivation(onPress);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      {...touchActivation}
      className={`sheet-map-back-button${className ? ` ${className}` : ""}`}
    >
      <BackIcon size={28} />
    </button>
  );
}
