import { useEffect, useState } from "react";
import { useMap } from "react-map-gl/mapbox";

import { resolveMapRef } from "../lib/resolve-map-ref";

export function useMapCanvasZoom(): number | null {
  const maps = useMap();
  const map = resolveMapRef(maps)?.getMap();
  const [zoom, setZoom] = useState<number | null>(() => map?.getZoom() ?? null);

  useEffect(() => {
    if (!map) {
      return;
    }

    const syncZoom = () => {
      setZoom(map.getZoom());
    };

    syncZoom();
    map.on("move", syncZoom);
    map.on("zoom", syncZoom);
    return () => {
      map.off("move", syncZoom);
      map.off("zoom", syncZoom);
    };
  }, [map]);

  return zoom;
}
