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
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onPress}
      className={`pointer-events-auto border-0 bg-transparent p-1 text-white hover:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 ${className}`.trim()}
    >
      <BackIcon size={28} />
    </button>
  );
}
