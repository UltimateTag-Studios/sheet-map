import type { MapRef } from "react-map-gl/mapbox";

/** Shell callback: map instance is published from `MapCanvas` `onLoad` only. */
export type PublishMapInstance = (mapRef: MapRef | null) => void;
