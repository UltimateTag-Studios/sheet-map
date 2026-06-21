export type PixelSize = {
  width: number;
  height: number;
};

export type PixelPoint = {
  x: number;
  y: number;
};

export type PixelRect = PixelPoint & PixelSize;
