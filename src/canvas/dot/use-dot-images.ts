import type { FeatureCollection, Point } from "geojson";
import { useLayoutEffect } from "react";
import { useMap } from "react-map-gl/mapbox";

import { resolveMapRef } from "../lib/resolve-map-ref";
import {
  collectDotVariants,
  createDotImageCanvas,
  dotImageId,
  MAP_DOT_IMAGE_PIXEL_RATIO,
} from "./dot-image";

type DotFeatureProperties = {
  primaryHex: string;
  secondaryHex?: string;
  imageId: string;
};

export function useMapCanvasDotImages(
  data: FeatureCollection<Point, DotFeatureProperties>,
) {
  const maps = useMap();

  useLayoutEffect(() => {
    const mapRef = resolveMapRef(maps);
    const map = mapRef?.getMap();
    if (!map) {
      return;
    }

    const registerImages = () => {
      for (const { primaryHex, secondaryHex, focused } of collectDotVariants(
        data.features,
      )) {
        const imageId = dotImageId(primaryHex, secondaryHex, { focused });
        if (map.hasImage(imageId)) {
          continue;
        }

        const canvas = createDotImageCanvas(primaryHex, secondaryHex, focused);
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
          { pixelRatio: MAP_DOT_IMAGE_PIXEL_RATIO },
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
