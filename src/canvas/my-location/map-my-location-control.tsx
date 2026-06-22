import type { ReactNode } from "react";

import { MapMyLocationButton } from "./map-my-location-button";

export type MapMyLocationButtonRenderProps = {
  tracking: boolean;
  onPress: () => void;
  ariaLabel: string;
};

export type MapMyLocationControlProps = {
  tracking: boolean;
  onPress: () => void;
  ariaLabel?: string;
  className?: string;
  renderButton?: (props: MapMyLocationButtonRenderProps) => ReactNode;
};

/** My-location overlay control with optional custom button rendering. */
export function MapMyLocationControl({
  tracking,
  onPress,
  ariaLabel = "Focus my location",
  className,
  renderButton,
}: MapMyLocationControlProps) {
  const buttonProps: MapMyLocationButtonRenderProps = {
    tracking,
    onPress,
    ariaLabel,
  };

  if (renderButton) {
    return renderButton(buttonProps);
  }

  return (
    <MapMyLocationButton
      ariaLabel={ariaLabel}
      onPress={onPress}
      tracking={tracking}
      className={className}
    />
  );
}
