import { createContext, useContext, useLayoutEffect } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { useMap } from "react-map-gl/mapbox";

import { resolveMapRef } from "./resolve-map-ref";

export type PublishMapInstance = (mapRef: MapRef | null) => void;

const MapCanvasInstanceContext = createContext<PublishMapInstance | null>(null);

type MapInstanceProviderProps = {
  publishMapInstance?: PublishMapInstance | null;
  children: React.ReactNode;
};

export function MapInstanceProvider({
  publishMapInstance = null,
  children,
}: MapInstanceProviderProps) {
  return (
    <MapCanvasInstanceContext.Provider value={publishMapInstance}>
      {children}
    </MapCanvasInstanceContext.Provider>
  );
}

function MapCanvasInstancePublisher() {
  const publish = useContext(MapCanvasInstanceContext);
  const maps = useMap();

  useLayoutEffect(() => {
    if (!publish) {
      return;
    }

    const mapRef = resolveMapRef(maps);
    if (mapRef) {
      publish(mapRef);
    }
  });

  return null;
}

export function MapInstancePublisherLayer() {
  return <MapCanvasInstancePublisher />;
}
