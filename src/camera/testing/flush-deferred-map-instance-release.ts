import { act } from "react";

/** Drain `useMapInstanceRelease` deferred cleanup (queueMicrotask). */
export async function flushDeferredMapInstanceRelease(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => queueMicrotask(resolve));
  });
}
