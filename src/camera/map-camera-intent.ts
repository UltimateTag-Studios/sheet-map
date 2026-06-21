import type { MapCameraAnchor } from "./map-camera-anchor";

export type MapCameraIntent = {
  key: string;
  coords: { lng: number; lat: number };
  instant?: boolean;
};

type MapPoint = {
  id: string;
  location?: { lng: number; lat: number };
};

function isInstantUserMotion(anchor: MapCameraAnchor): boolean {
  if (!anchor || anchor.kind !== "user") {
    return true;
  }
  return anchor.motion !== "smooth";
}

export function buildPointListCameraIntent(options: {
  cameraAnchor: MapCameraAnchor;
  userLocation?: { lng: number; lat: number };
  points?: MapPoint[];
  cameraEpoch: number;
}): MapCameraIntent | null {
  const { cameraAnchor, userLocation, points, cameraEpoch } = options;

  if (!cameraAnchor) {
    return null;
  }

  const scope = `e${cameraEpoch}`;

  if (cameraAnchor.kind === "user") {
    if (!userLocation) {
      return null;
    }

    const instant = isInstantUserMotion(cameraAnchor);
    const motionKey = instant ? "instant" : "smooth";

    return {
      key: `user:${userLocation.lng}:${userLocation.lat}:${motionKey}:${scope}`,
      coords: userLocation,
      instant,
    };
  }

  const point = points?.find((entry) => entry.id === cameraAnchor.id);
  if (!point?.location) {
    return null;
  }

  return {
    key: `point:${cameraAnchor.id}:${scope}`,
    coords: point.location,
  };
}
