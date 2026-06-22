import type { CSSProperties, ReactNode } from "react";

export type MapLayoutRootProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** Sized wrapper for map layout chrome + routed children. */
export function MapLayoutRoot({
  children,
  className,
  style,
}: MapLayoutRootProps) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
