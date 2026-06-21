export type SheetHostFixture = {
  host: HTMLDivElement;
  sheetSlide: HTMLDivElement;
  canvas: HTMLCanvasElement;
  remove: () => void;
};

export function mountSheetHostFixture(
  mockCanvas: (
    overrides?: Partial<HTMLCanvasElement> & { rect?: Partial<DOMRect> },
  ) => HTMLCanvasElement,
  canvasOverrides: Parameters<typeof mockCanvas>[0] = {},
  sheetSlideRect: Partial<DOMRect> = {},
): SheetHostFixture {
  const host = document.createElement("div");
  host.className = "sheet-host";
  const sheetSlide = document.createElement("div");
  sheetSlide.className = "sheet-slide";
  host.appendChild(sheetSlide);
  document.body.appendChild(host);

  const canvas = mockCanvas({
    ...canvasOverrides,
    closest: (selector: string) => (selector === ".sheet-host" ? host : null),
  });

  sheetSlide.getBoundingClientRect = () =>
    ({
      top: 0,
      bottom: 0,
      left: 0,
      right: 400,
      width: 400,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
      ...sheetSlideRect,
    }) as DOMRect;

  return {
    host,
    sheetSlide,
    canvas,
    remove: () => {
      host.remove();
    },
  };
}
