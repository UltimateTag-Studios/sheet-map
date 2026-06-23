import { useLayoutEffect, useState } from "react";

import {
  DEFAULT_MAP_ITEM_MARKER_BORDER_WIDTH,
  DEFAULT_MAP_ITEM_MARKER_HIT_SIZE,
  DEFAULT_MAP_ITEM_MARKER_SIZE,
  DEFAULT_MAP_LOCATION_MARKER_HIT_SIZE,
  DEFAULT_MAP_LOCATION_MARKER_SIZE,
  SHEET_MAP_LAYOUT_VARS,
} from "../../shell/map-shell-layout-vars";
import { MAP_MARKER_HIT_SIZE_PX } from "./hit";
import { MAP_ITEM_MARKER_SIZE_PX, MAP_LOCATION_MARKER_SIZE_PX } from "./style";

const LAYOUT_ROOT_SELECTOR = ".sheet-map-layout";

export type MapLayoutMarkerSizes = {
  locationMarkerSizePx: number;
  locationMarkerHitSizePx: number;
  itemMarkerSizePx: number;
  itemMarkerHitSizePx: number;
  itemMarkerBorderWidthPx: number;
};

function parseCssLengthPx(raw: string, fallbackPx: number): number {
  const trimmed = raw.trim();
  if (!trimmed) {
    return fallbackPx;
  }
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : fallbackPx;
}

function readLayoutLengthPx(
  layoutRoot: Element,
  cssVar: string,
  fallback: string,
): number {
  const style = getComputedStyle(layoutRoot);
  const raw = style.getPropertyValue(cssVar).trim();
  if (raw) {
    return parseCssLengthPx(raw, parseCssLengthPx(fallback, 0));
  }
  return parseCssLengthPx(fallback, 0);
}

function readDefaultMarkerSizes(): MapLayoutMarkerSizes {
  return {
    locationMarkerSizePx: parseCssLengthPx(
      DEFAULT_MAP_LOCATION_MARKER_SIZE,
      MAP_LOCATION_MARKER_SIZE_PX,
    ),
    locationMarkerHitSizePx: parseCssLengthPx(
      DEFAULT_MAP_LOCATION_MARKER_HIT_SIZE,
      MAP_MARKER_HIT_SIZE_PX,
    ),
    itemMarkerSizePx: parseCssLengthPx(
      DEFAULT_MAP_ITEM_MARKER_SIZE,
      MAP_ITEM_MARKER_SIZE_PX,
    ),
    itemMarkerHitSizePx: parseCssLengthPx(
      DEFAULT_MAP_ITEM_MARKER_HIT_SIZE,
      MAP_ITEM_MARKER_SIZE_PX,
    ),
    itemMarkerBorderWidthPx: parseCssLengthPx(
      DEFAULT_MAP_ITEM_MARKER_BORDER_WIDTH,
      2,
    ),
  };
}

/** Reads marker size tokens from `.sheet-map-layout` CSS custom properties. */
export function useMapLayoutMarkerSizes(): MapLayoutMarkerSizes {
  const [sizes, setSizes] = useState<MapLayoutMarkerSizes>(
    readDefaultMarkerSizes,
  );

  useLayoutEffect(() => {
    const layoutRoot = document.querySelector(LAYOUT_ROOT_SELECTOR);
    if (!layoutRoot) {
      setSizes(readDefaultMarkerSizes());
      return;
    }

    const sync = () => {
      setSizes({
        locationMarkerSizePx: readLayoutLengthPx(
          layoutRoot,
          SHEET_MAP_LAYOUT_VARS.locationMarkerSize,
          DEFAULT_MAP_LOCATION_MARKER_SIZE,
        ),
        locationMarkerHitSizePx: readLayoutLengthPx(
          layoutRoot,
          SHEET_MAP_LAYOUT_VARS.locationMarkerHitSize,
          DEFAULT_MAP_LOCATION_MARKER_HIT_SIZE,
        ),
        itemMarkerSizePx: readLayoutLengthPx(
          layoutRoot,
          SHEET_MAP_LAYOUT_VARS.itemMarkerSize,
          DEFAULT_MAP_ITEM_MARKER_SIZE,
        ),
        itemMarkerHitSizePx: readLayoutLengthPx(
          layoutRoot,
          SHEET_MAP_LAYOUT_VARS.itemMarkerHitSize,
          DEFAULT_MAP_ITEM_MARKER_HIT_SIZE,
        ),
        itemMarkerBorderWidthPx: readLayoutLengthPx(
          layoutRoot,
          SHEET_MAP_LAYOUT_VARS.itemMarkerBorderWidth,
          DEFAULT_MAP_ITEM_MARKER_BORDER_WIDTH,
        ),
      });
    };

    sync();

    const observer = new MutationObserver(sync);
    observer.observe(layoutRoot, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return sizes;
}
