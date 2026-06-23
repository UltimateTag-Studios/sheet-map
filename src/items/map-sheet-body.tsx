import type { ReactNode } from "react";

export type MapSheetBodyProps = {
  children: ReactNode;
};

/** Default scroll body wrapper for route sheet content. */
export function MapSheetBody({ children }: MapSheetBodyProps) {
  return <div className="sheet-map-sheet-body">{children}</div>;
}
