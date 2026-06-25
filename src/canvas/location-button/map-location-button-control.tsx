import type { ReactNode } from "react";

import { MapLocationButton } from "./map-location-button";

export type MapLocationButtonRenderProps = {
  tracking: boolean;
  onPress: () => void;
  ariaLabel: string;
  disabled?: boolean;
};

export type MapLocationButtonControlProps = {
  tracking: boolean;
  onPress: () => void;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  renderButton?: (props: MapLocationButtonRenderProps) => ReactNode;
};

/** Location overlay control with optional custom button rendering. */
export function MapLocationButtonControl({
  tracking,
  onPress,
  ariaLabel = "Focus my location",
  disabled = false,
  className,
  renderButton,
}: MapLocationButtonControlProps) {
  const buttonProps: MapLocationButtonRenderProps = {
    tracking,
    onPress,
    ariaLabel,
    disabled,
  };

  if (renderButton) {
    return renderButton(buttonProps);
  }

  return (
    <MapLocationButton
      ariaLabel={ariaLabel}
      onPress={onPress}
      tracking={tracking}
      disabled={disabled}
      className={className}
    />
  );
}
