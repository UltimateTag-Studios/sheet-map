/** Map canvas + visual viewport geometry in client pixels. */
export type MapCanvasScreenGeometry = {
  canvasTop: number;
  canvasBottom: number;
  canvasLeft: number;
  canvasRight: number;
  viewportTop?: number;
  viewportLeft?: number;
  viewportHeight: number;
  viewportWidth: number;
};
