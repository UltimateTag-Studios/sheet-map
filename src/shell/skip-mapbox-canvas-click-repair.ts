/** Mapbox GL draws its own hit target — DOM click repair must not synthesize clicks on it. */
export function shouldSkipMapboxCanvasClickRepair(target: Element): boolean {
  return target.matches(".mapboxgl-canvas");
}
