import {
  SheetLayout,
  type SheetSnap,
  showCollapsedBottomChromePadding,
  useSheetContext,
} from "@siegetag/sheet";
import {
  tabBarCollapsedAreaPaddingBottom,
  tabBarScrollAreaPaddingBottom,
} from "@siegetag/ui";
import type { ReactNode } from "react";

export type MapSheetLayoutProps = {
  sheetSnap: SheetSnap;
  header?: ReactNode;
  body: ReactNode;
  reserveFloatingTabBar?: boolean;
};

/** Map shell adapter: wires floating tab bar padding into generic sheet layout. */
export function MapSheetLayout({
  sheetSnap,
  header,
  body,
  reserveFloatingTabBar = false,
}: MapSheetLayoutProps) {
  const { visibleHeightPx, collapsedHeightPx, isDragging } = useSheetContext();

  const showCollapsedHeaderPadding = showCollapsedBottomChromePadding({
    reserveBottomChrome: reserveFloatingTabBar,
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
        showCollapsedHeaderPadding
          ? { paddingBottom: tabBarCollapsedAreaPaddingBottom() }
          : undefined
      }
      bodyInnerStyle={
        reserveFloatingTabBar
          ? { paddingBottom: tabBarScrollAreaPaddingBottom() }
          : undefined
      }
    />
  );
}
