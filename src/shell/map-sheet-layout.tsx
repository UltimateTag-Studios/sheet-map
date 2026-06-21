import { SheetLayout } from "@siegetag/sheet";
import type { ReactNode } from "react";

import type { MapBottomChromeReserve } from "./types";

export type MapSheetLayoutProps = {
  header?: ReactNode;
  body: ReactNode;
  bottomChromeReserve?: MapBottomChromeReserve;
};

/** Map shell adapter: wires bottom-chrome reserve spacer and body float gap. */
export function MapSheetLayout({
  header,
  body,
  bottomChromeReserve,
}: MapSheetLayoutProps) {
  return (
    <SheetLayout
      header={header}
      body={body}
      bottomReserve={bottomChromeReserve?.reserve}
      bodyInnerStyle={
        bottomChromeReserve
          ? { paddingBottom: bottomChromeReserve.floatGap }
          : undefined
      }
    />
  );
}
