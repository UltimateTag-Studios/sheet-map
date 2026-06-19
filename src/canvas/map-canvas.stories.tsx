import type { Meta, StoryObj } from "@storybook/react";

import { MapBackButton } from "./map-back-button";
import { MapMyLocationButton } from "./map-my-location-button";

const meta = {
  title: "Patterns/MapCanvas",
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="bg-neutral-950 p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const BackButton: Story = {
  render: () => (
    <div className="relative h-32 w-full max-w-xs rounded-lg bg-neutral-800/40">
      <div className="absolute right-3 top-3">
        <MapBackButton ariaLabel="Back to map" onPress={() => undefined} />
      </div>
    </div>
  ),
};

export const MyLocationButton: Story = {
  render: () => (
    <div className="relative h-32 w-full max-w-xs rounded-lg bg-neutral-800/40">
      <div className="absolute bottom-3 left-3 flex gap-3">
        <MapMyLocationButton
          ariaLabel="Focus on my location"
          onPress={() => undefined}
        />
        <MapMyLocationButton
          ariaLabel="Focus on my location"
          focused
          onPress={() => undefined}
        />
      </div>
    </div>
  ),
};

/** Static preview — overlay position comes from live map + sheet geometry at runtime. */
export const VisibleAreaOverlay: Story = {
  render: () => (
    <div className="relative h-[480px] w-full max-w-sm overflow-hidden rounded-lg border border-white/10">
      <div className="absolute inset-0 bg-neutral-800/30" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{ height: "65%" }}
      >
        <div className="absolute left-2 top-2 h-4 w-4 border-cyan-400/50 border-t-2 border-l-2" />
        <div className="absolute right-2 top-2 h-4 w-4 border-cyan-400/50 border-t-2 border-r-2" />
        <div className="absolute bottom-2 left-2 h-4 w-4 border-cyan-400/50 border-b-2 border-l-2" />
        <div className="absolute bottom-2 right-2 h-4 w-4 border-cyan-400/50 border-r-2 border-b-2" />
        <div className="absolute bottom-3 left-3">
          <MapMyLocationButton
            ariaLabel="Focus on my location"
            focused
            onPress={() => undefined}
          />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[35%] rounded-t-lg bg-neutral-900/90" />
    </div>
  ),
};
