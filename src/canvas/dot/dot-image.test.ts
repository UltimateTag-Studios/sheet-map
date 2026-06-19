import { describe, expect, it } from "vitest";

import { createDotImageCanvas, dotImageId } from "./dot-image";
import { MAP_DOT_FOCUS_STROKE_COLOR, MAP_DOT_STROKE_COLOR } from "./style";

describe("dotImageId", () => {
  it("builds a stable id for single-color dots", () => {
    expect(dotImageId("#FF00AA")).toBe("map-dot-ff00aa");
  });

  it("builds a stable id for dual-color dots", () => {
    expect(dotImageId("#FF00AA", "#0011BB")).toBe("map-dot-ff00aa-0011bb");
  });

  it("suffixes focused variants", () => {
    expect(dotImageId("#FF00AA", undefined, { focused: true })).toBe(
      "map-dot-ff00aa-focused",
    );
  });
});

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function pixelMatchesHex(
  data: Uint8ClampedArray,
  index: number,
  hex: string,
  alpha = 255,
): boolean {
  const [r, g, b] = hexToRgb(hex);
  return (
    data[index] === r &&
    data[index + 1] === g &&
    data[index + 2] === b &&
    data[index + 3] === alpha
  );
}

function pixelIndex(width: number, x: number, y: number): number {
  return (y * width + x) * 4;
}

describe("createDotImageCanvas", () => {
  it("draws fill and border in one aligned sprite", () => {
    const canvas = createDotImageCanvas("#245BFF", undefined, false);
    const context = canvas.getContext("2d");
    expect(context).toBeDefined();
    if (!context) {
      return;
    }

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const center = canvas.width / 2;
    const radiusPx = 8 * 2;
    const centerIndex = pixelIndex(canvas.width, center, center);
    const edgeIndex = pixelIndex(
      canvas.width,
      Math.round(center + radiusPx),
      Math.round(center),
    );

    expect(pixelMatchesHex(imageData.data, centerIndex, "#245BFF")).toBe(true);
    expect(
      pixelMatchesHex(imageData.data, edgeIndex, MAP_DOT_STROKE_COLOR),
    ).toBe(true);
  });

  it("uses the accent border when focused", () => {
    const canvas = createDotImageCanvas("#245BFF", undefined, true);
    const context = canvas.getContext("2d");
    expect(context).toBeDefined();
    if (!context) {
      return;
    }

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const center = canvas.width / 2;
    const radiusPx = 8 * 2;
    const edgeIndex = pixelIndex(
      canvas.width,
      Math.round(center + radiusPx),
      Math.round(center),
    );

    expect(
      pixelMatchesHex(imageData.data, edgeIndex, MAP_DOT_FOCUS_STROKE_COLOR),
    ).toBe(true);
  });
});
