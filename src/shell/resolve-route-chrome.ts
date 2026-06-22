import type { SheetSnap } from "@siegetag/sheet";
import { createElement, type ReactNode } from "react";

import type { MapSheetHeaderProps, MapShellSlots } from "./config";
import { DefaultMapSheetHeader } from "./default-map-sheet-header";
import { MapCloseSheetButton } from "./map-close-sheet-button";
import type { MapRouteContent } from "./map-route-context";

function isSheetOpen(snap: SheetSnap): boolean {
  return snap !== "collapsed";
}

export function resolveRouteHeader(
  routeContent: MapRouteContent | null,
  layoutSlots: MapShellSlots,
): ReactNode {
  if (routeContent?.headerContent) {
    return routeContent.headerContent;
  }

  if (!routeContent?.header) {
    return null;
  }

  const renderHeader =
    routeContent.slots?.renderSheetHeader ??
    layoutSlots.renderSheetHeader ??
    DefaultMapSheetHeader;

  return renderHeader(routeContent.header);
}

export function resolveRouteBody(
  routeContent: MapRouteContent | null,
  layoutSlots: MapShellSlots,
  defaultBody: ReactNode,
): ReactNode {
  const body = routeContent?.body ?? defaultBody;
  const renderBody = layoutSlots.renderSheetBody;
  if (renderBody) {
    return renderBody(body);
  }
  return body;
}

export function resolveRouteOverlay(
  routeContent: MapRouteContent | null,
  layoutSlots: MapShellSlots,
  overlayContext: Parameters<NonNullable<MapShellSlots["renderOverlay"]>>[0],
): ReactNode | null {
  if (routeContent?.overlay === null) {
    return null;
  }

  if (routeContent?.overlay !== undefined) {
    return routeContent.overlay;
  }

  return layoutSlots.renderOverlay?.(overlayContext) ?? null;
}

export function resolveRouteTopRightChrome(
  routeContent: MapRouteContent | null,
  layoutSlots: MapShellSlots,
  args: {
    sheetSnap: SheetSnap;
    closeSheet: () => void;
    closeAriaLabel: string;
  },
): ReactNode | null {
  if (isSheetOpen(args.sheetSnap)) {
    const renderClose =
      routeContent?.slots?.renderCloseButton ?? layoutSlots.renderCloseButton;

    return (
      renderClose?.(args.closeSheet, args.closeAriaLabel) ??
      createElement(MapCloseSheetButton, {
        ariaLabel: args.closeAriaLabel,
        onPress: args.closeSheet,
      })
    );
  }

  return routeContent?.collapsedTopRight ?? null;
}

export type { MapSheetHeaderProps };
