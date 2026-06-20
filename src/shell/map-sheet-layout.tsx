import {
  SheetLayout,
  type SheetSnap,
  showCollapsedBottomChromePadding,
  useSheetContext,
} from "@siegetag/sheet";
import type { ReactNode } from "react";

import type { MapBottomChromeReserve } from "./config";

export type MapSheetLayoutProps = {
  sheetSnap: SheetSnap;
  header?: ReactNode;
  body: ReactNode;
  bottomChromeReserve?: MapBottomChromeReserve;
};

/** Map shell adapter: wires optional bottom-chrome padding into generic sheet layout. */
export function MapSheetLayout({
  sheetSnap,
  header,
  body,
  bottomChromeReserve,
}: MapSheetLayoutProps) {
  const { visibleHeightPx, collapsedHeightPx, isDragging } = useSheetContext();

  const collapsedHeaderPaddingBottom =
    bottomChromeReserve?.collapsedHeaderPaddingBottom;
  const scrollBodyPaddingBottom = bottomChromeReserve?.scrollBodyPaddingBottom;

  const showCollapsedHeaderPadding = showCollapsedBottomChromePadding({
    reserveBottomChrome: collapsedHeaderPaddingBottom !== undefined,
    sheetSnap,
    isDragging,
    visibleHeightPx,
    collapsedHeightPx,
  });

  return (
    <SheetLayout
      header={header}
      body={body}
      headerStyle={
        showCollapsedHeaderPadding && collapsedHeaderPaddingBottom
          ? { paddingBottom: collapsedHeaderPaddingBottom }
          : undefined
      }
      bodyInnerStyle={
        scrollBodyPaddingBottom
          ? { paddingBottom: scrollBodyPaddingBottom }
          : undefined
      }
    />
  );
}
