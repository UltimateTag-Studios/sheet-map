import type { FeatureCollection, Point } from "geojson";
import { useLayoutEffect } from "react";
import { useMap } from "react-map-gl/mapbox";

import { resolveMapRef } from "../instance/resolve-map-ref";
import {
  collectMarkerImageVariants,
  createMarkerImageCanvas,
  MAP_MARKER_SPRITE_IMAGE_PIXEL_RATIO,
  markerImageId,
} from "./marker-image";

type MarkerFeatureProperties = {
  primaryHex: string;
  secondaryHex?: string;
  imageId: string;
};

export function useMapCanvasMarkerImages(
  data: FeatureCollection<Point, MarkerFeatureProperties>,
) {
  const maps = useMap();

  useLayoutEffect(() => {
    const mapRef = resolveMapRef(maps);
    const map = mapRef?.getMap();
    if (!map) {
      return;
    }

    const registerImages = () => {
      for (const {
        primaryHex,
        secondaryHex,
        focused,
      } of collectMarkerImageVariants(data.features)) {
        const imageId = markerImageId(primaryHex, secondaryHex, { focused });
        if (map.hasImage(imageId)) {
          continue;
        }

        const canvas = createMarkerImageCanvas(
          primaryHex,
          secondaryHex,
          focused,
        );
        const context = canvas.getContext("2d");
        if (!context) {
          continue;
        }

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        map.addImage(
          imageId,
          {
            width: canvas.width,
            height: canvas.height,
            data: imageData.data,
          },
          { pixelRatio: MAP_MARKER_SPRITE_IMAGE_PIXEL_RATIO },
        );
      }
    };

    registerImages();
    map.on("styledata", registerImages);
    return () => {
      map.off("styledata", registerImages);
    };
  }, [data, maps]);
}
