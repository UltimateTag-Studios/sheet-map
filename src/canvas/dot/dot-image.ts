import {
  MAP_DOT_FOCUS_STROKE_COLOR,
  MAP_DOT_RADIUS_PX,
  MAP_DOT_STROKE_COLOR,
  MAP_DOT_STROKE_WIDTH_PX,
} from "./style";

/** Diagonal split angle for dual-color map dots (degrees, clockwise from east). */
export const MAP_DOT_SPLIT_ANGLE_DEG = 30;

export const MAP_DOT_IMAGE_PIXEL_RATIO = 2;

/** CSS pixels — fill radius + half stroke on each side. */
export const MAP_DOT_CSS_SIZE_PX =
  (MAP_DOT_RADIUS_PX + MAP_DOT_STROKE_WIDTH_PX / 2) * 2;

function toCssHex(hex: string): string {
  return hex.startsWith("#") ? hex : `#${hex}`;
}

function borderHexForDot(focused: boolean): string {
  return focused ? MAP_DOT_FOCUS_STROKE_COLOR : MAP_DOT_STROKE_COLOR;
}

function drawDotFill(
  context: CanvasRenderingContext2D,
  center: number,
  radiusPx: number,
  primaryHex: string,
  secondaryHex?: string,
): void {
  if (!secondaryHex) {
    context.fillStyle = toCssHex(primaryHex);
    context.beginPath();
    context.arc(center, center, radiusPx, 0, Math.PI * 2);
    context.fill();
    return;
  }

  const primary = toCssHex(primaryHex);
  const secondary = toCssHex(secondaryHex);
  const splitRadians = (MAP_DOT_SPLIT_ANGLE_DEG * Math.PI) / 180;

  context.save();
  context.beginPath();
  context.arc(center, center, radiusPx, 0, Math.PI * 2);
  context.clip();
  context.fillStyle = secondary;
  context.fillRect(
    center - radiusPx,
    center - radiusPx,
    radiusPx * 2,
    radiusPx * 2,
  );
  context.translate(center, center);
  context.rotate(splitRadians);
  context.beginPath();
  context.rect(0, -radiusPx, radiusPx, radiusPx * 2);
  context.clip();
  context.fillStyle = primary;
  context.fillRect(-radiusPx, -radiusPx, radiusPx * 2, radiusPx * 2);
  context.restore();
}

function drawDotBorder(
  context: CanvasRenderingContext2D,
  center: number,
  radiusPx: number,
  strokeWidthPx: number,
  strokeColor: string,
): void {
  context.strokeStyle = strokeColor;
  context.lineWidth = strokeWidthPx;
  context.beginPath();
  context.arc(center, center, radiusPx, 0, Math.PI * 2);
  context.stroke();
}

export function normalizeDotHex(hex: string): string {
  return hex.startsWith("#") ? hex.slice(1).toLowerCase() : hex.toLowerCase();
}

export type DotImageOptions = {
  focused?: boolean;
};

export function dotImageId(
  primaryHex: string,
  secondaryHex?: string,
  options: DotImageOptions = {},
): string {
  const primary = normalizeDotHex(primaryHex);
  const focusedSuffix = options.focused ? "-focused" : "";
  if (!secondaryHex) {
    return `map-dot-${primary}${focusedSuffix}`;
  }
  return `map-dot-${primary}-${normalizeDotHex(secondaryHex)}${focusedSuffix}`;
}

export function createDotImageCanvas(
  primaryHex: string,
  secondaryHex: string | undefined,
  focused: boolean,
): HTMLCanvasElement {
  const pixelRatio = MAP_DOT_IMAGE_PIXEL_RATIO;
  const pixelSize = Math.round(MAP_DOT_CSS_SIZE_PX * pixelRatio);
  const center = pixelSize / 2;
  const radiusPx = MAP_DOT_RADIUS_PX * pixelRatio;
  const strokeWidthPx = MAP_DOT_STROKE_WIDTH_PX * pixelRatio;

  const canvas = document.createElement("canvas");
  canvas.width = pixelSize;
  canvas.height = pixelSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context unavailable");
  }

  context.clearRect(0, 0, pixelSize, pixelSize);
  drawDotFill(context, center, radiusPx, primaryHex, secondaryHex);
  drawDotBorder(
    context,
    center,
    radiusPx,
    strokeWidthPx,
    borderHexForDot(focused),
  );

  return canvas;
}

export type DotVariant = {
  primaryHex: string;
  secondaryHex?: string;
  focused: boolean;
};

export function collectDotVariants(
  features: Array<{
    properties?: {
      primaryHex?: string;
      secondaryHex?: string;
      imageId?: string;
    };
  }>,
): DotVariant[] {
  const seen = new Set<string>();
  const variants: DotVariant[] = [];

  for (const feature of features) {
    const primaryHex = feature.properties?.primaryHex;
    if (!primaryHex) {
      continue;
    }

    const secondaryHex = feature.properties?.secondaryHex || undefined;
    const imageId = feature.properties?.imageId;
    const focused = imageId?.endsWith("-focused") ?? false;
    const key = dotImageId(primaryHex, secondaryHex, { focused });
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    variants.push({ primaryHex, secondaryHex, focused });
  }

  return variants;
}
