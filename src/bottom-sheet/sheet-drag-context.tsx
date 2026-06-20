import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { BottomSheetSnap } from "./bottom-sheet";
import { showCollapsedTabBarPeekPadding } from "./collapsed-tab-bar-peek-padding";
import { canBodyScroll as deriveCanBodyScroll } from "./sheet-scroll-mode";

export type SheetDragContextValue = {
  canBodyScrollLive: boolean;
  isDragging: boolean;
  collapsedHeightPx: number;
  fullHeightPx: number;
  snapPoints: Array<number | string>;
  getVisibleDrawerHeightPx: () => number;
  applySnapHeightPx: (heightPx: number) => void;
  beginBodyGesture: () => void;
  endBodyGesture: () => void;
  snapToNearestAfterPan: () => void;
};

const SheetDragContext = createContext<SheetDragContextValue | null>(null);

export function SheetDragContextProvider({
  value,
  children,
}: {
  value: SheetDragContextValue;
  children: ReactNode;
}) {
  return (
    <SheetDragContext.Provider value={value}>
      {children}
    </SheetDragContext.Provider>
  );
}

export function useSheetDragContext(): SheetDragContextValue {
  const value = useContext(SheetDragContext);
  if (!value) {
    throw new Error("useSheetDragContext must be used within BottomSheet");
  }
  return value;
}

export function useSheetBodyPanContext(): SheetDragContextValue {
  return useSheetDragContext();
}

export function useCanBodyScroll(sheetSnap: BottomSheetSnap): boolean {
  const { canBodyScrollLive, isDragging } = useSheetDragContext();
  return deriveCanBodyScroll({ sheetSnap, canBodyScrollLive, isDragging });
}

export function useShowCollapsedTabBarPeekPadding(
  sheetSnap: BottomSheetSnap,
  reserveFloatingTabBar: boolean,
): boolean {
  const { isDragging, collapsedHeightPx, getVisibleDrawerHeightPx } =
    useSheetDragContext();

  return showCollapsedTabBarPeekPadding({
    reserveFloatingTabBar,
    sheetSnap,
    isDragging,
    visibleHeightPx: getVisibleDrawerHeightPx(),
    collapsedHeightPx,
  });
}
