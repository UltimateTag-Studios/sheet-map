import type { SheetSnap } from "@siegetag/sheet";
import { createElement, type ReactNode } from "react";

import { MapItemsLayer } from "../items/map-items-layer";
import { MapSheetBody } from "../items/map-sheet-body";
import { MapSheetHeader } from "../items/map-sheet-header";
import { MapSheetList } from "../items/map-sheet-list";
import type { MapSheetHeaderProps, MapShellSlots } from "./config";
import { MapActionButton } from "./map-action-button";
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
    MapSheetHeader;

  return renderHeader(routeContent.header);
}

export function resolveRouteBody(
  routeContent: MapRouteContent | null,
  layoutSlots: MapShellSlots,
  defaultBody: ReactNode,
): ReactNode {
  let body: ReactNode;

  if (routeContent?.body !== undefined) {
    body = routeContent.body;
  } else if (routeContent?.items && routeContent.items.length > 0) {
    body = createElement(
      MapSheetBody,
      null,
      createElement(MapSheetList, { items: routeContent.items }),
    );
  } else {
    body = defaultBody;
  }

  const renderBody = layoutSlots.renderSheetBody;
  if (renderBody) {
    return renderBody(body);
  }
  return body;
}

export function resolveRouteMapLayers(
  routeContent: MapRouteContent | null,
): ReactNode | null {
  if (routeContent?.mapLayers !== undefined) {
    return routeContent.mapLayers;
  }

  const items = routeContent?.items;
  if (!items || items.length === 0) {
    return null;
  }

  const hasLocatedItem = items.some((item) => item.location !== null);
  if (!hasLocatedItem) {
    return null;
  }

  return createElement(MapItemsLayer, { items });
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

export function resolveRouteActionChrome(
  routeContent: MapRouteContent | null,
  layoutSlots: MapShellSlots,
  args: {
    sheetSnap: SheetSnap;
    closeSheet: () => void;
    closeAriaLabel: string;
  },
): ReactNode | null {
  if (isSheetOpen(args.sheetSnap)) {
    const renderAction =
      routeContent?.slots?.renderActionButton ?? layoutSlots.renderActionButton;

    return (
      renderAction?.(args.closeSheet, args.closeAriaLabel) ??
      createElement(MapActionButton, {
        ariaLabel: args.closeAriaLabel,
        onPress: args.closeSheet,
      })
    );
  }

  return routeContent?.collapsedAction ?? null;
}

export type { MapSheetHeaderProps };
