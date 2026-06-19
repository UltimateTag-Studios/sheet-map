import type { MapCameraIntent } from "./map-camera-intent";

/** Clears one-shot smooth user motion after the camera finishes animating. */
export function resetUserCameraMotionOnFulfilled(
  fulfilledIntent: MapCameraIntent,
  resetUserCameraMotion: () => void,
): void {
  if (fulfilledIntent.instant === false) {
    resetUserCameraMotion();
  }
}
