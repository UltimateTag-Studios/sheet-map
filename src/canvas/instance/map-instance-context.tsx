import { createContext, useContext, useEffect, useLayoutEffect } from "react";
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
  const mapRef = resolveMapRef(maps);

  useLayoutEffect(() => {
    if (!publish) {
      return;
    }

    publish(mapRef);

    return () => {
      publish(null);
    };
  }, [publish, mapRef]);

  useEffect(() => {
    if (!publish || !mapRef) {
      return;
    }

    const map = mapRef.getMap();
    const republish = () => {
      publish(mapRef);
    };

    map.on("load", republish);
    map.on("idle", republish);

    return () => {
      map.off("load", republish);
      map.off("idle", republish);
    };
  }, [publish, mapRef]);
}

export function MapInstancePublisherLayer() {
  return <MapCanvasInstancePublisher />;
}
