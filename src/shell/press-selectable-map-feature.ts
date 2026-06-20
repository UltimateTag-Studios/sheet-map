import type { MapSelectablePoint } from "./map-route-context";

export function pressSelectableMapFeature(
  id: string,
  selectablePoints: MapSelectablePoint[],
  focusPoint: (pointId: string, hasLocation: boolean) => void,
): void {
  const point = selectablePoints.find((entry) => entry.id === id);
  focusPoint(id, Boolean(point?.location));
}
