/**
 * Route enter-fly zoom policy:
 * - explicit zoom on the entry → use it
 * - no explicit zoom but map already has a level → preserve (undefined)
 * - no explicit zoom and no level yet → default
 */
export function resolveEnterFlyZoom(options: {
  explicitZoom?: number;
  anchorZoom?: number;
  defaultZoom: number;
}): number | undefined {
  if (options.explicitZoom !== undefined) {
    return options.explicitZoom;
  }

  if (options.anchorZoom !== undefined) {
    return undefined;
  }

  return options.defaultZoom;
}
