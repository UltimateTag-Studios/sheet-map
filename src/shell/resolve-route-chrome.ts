import type { SheetSnap } from "@siegetag/sheet";
import { createElement, type ReactNode } from "react";

import { MapItemsLayer } from "../items/map-items-layer";
import { MapSheetBody } from "../items/map-sheet-body";
import { MapSheetList } from "../items/map-sheet-list";
import type { MapSheetListStatus } from "../items/types";
import type { MapShellSlots } from "./config";
import { MapActionButton } from "./map-action-button";
import type { MapRouteContent } from "./map-route-context";

function isSheetOpen(snap: SheetSnap): boolean {
  return snap !== "collapsed";
}

function resolveListStatus(
  routeContent: MapRouteContent | null,
): MapSheetListStatus | null {
  if (!routeContent) {
    return null;
  }

  if (routeContent.listStatus) {
    return routeContent.listStatus;
  }

  if (routeContent.items) {
    return "ready";
  }

  return null;
}

export function resolveRouteHeader(
  routeContent: MapRouteContent | null,
  layoutSlots: MapShellSlots,
  options?: { debug?: boolean },
): ReactNode {
  if (routeContent?.headerContent) {
    return routeContent.headerContent;
  }

  if (!routeContent?.header) {
    return null;
  }

  const renderHeader =
    routeContent.slots?.renderSheetHeader ?? layoutSlots.renderSheetHeader;

  if (!renderHeader) {
    if (options?.debug) {
      console.warn(
        "[sheet-map] Route registered header data but no renderSheetHeader slot is configured.",
      );
    }
    return null;
  }

  return renderHeader(routeContent.header);
}

export function resolveRouteBody(
  routeContent: MapRouteContent | null,
  layoutSlots: MapShellSlots,
  defaultBody: ReactNode,
): ReactNode {
  let body: ReactNode;

  if (routeContent?.bodyContent !== undefined) {
    body = routeContent.bodyContent;
  } else {
    const listStatus = resolveListStatus(routeContent);

    if (listStatus === "loading") {
      body = createElement(
        MapSheetBody,
        null,
        layoutSlots.renderSheetListLoading?.() ?? null,
      );
    } else if (listStatus === "empty") {
      body = createElement(
        MapSheetBody,
        null,
        layoutSlots.renderSheetListEmpty?.() ?? null,
      );
    } else if (listStatus === "ready" && routeContent?.items) {
      body = createElement(
        MapSheetBody,
        null,
        createElement(MapSheetList, { items: routeContent.items }),
      );
    } else {
      body = defaultBody;
    }
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

export type { MapRouteHeader } from "./map-route-header";
