export type SheetHostFixture = {
  host: HTMLDivElement;
  sheet: HTMLDivElement;
  canvas: HTMLCanvasElement;
  remove: () => void;
};

export function mountSheetHostFixture(
  mockCanvas: (
    overrides?: Partial<HTMLCanvasElement> & { rect?: Partial<DOMRect> },
  ) => HTMLCanvasElement,
  canvasOverrides: Parameters<typeof mockCanvas>[0] = {},
  sheetRect: Partial<DOMRect> = {},
): SheetHostFixture {
  const host = document.createElement("div");
  host.className = "sheet-host";
  const sheet = document.createElement("div");
  sheet.className = "sheet";
  host.appendChild(sheet);
  document.body.appendChild(host);

  const canvas = mockCanvas({
    ...canvasOverrides,
    closest: (selector: string) => (selector === ".sheet-host" ? host : null),
  });

  sheet.getBoundingClientRect = () =>
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
      ...sheetRect,
    }) as DOMRect;

  return {
    host,
    sheet,
    canvas,
    remove: () => {
      host.remove();
    },
  };
}
