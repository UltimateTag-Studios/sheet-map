import type { Meta, StoryObj } from "@storybook/react";

import "../../styles/sheet-map.css";

import { MapBackButton } from "./map-back-button";
import { MapMyLocationButton } from "./map-my-location-button";

const meta = {
  title: "Patterns/MapCanvas",
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="sheet-map-story-chrome">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const BackButton: Story = {
  render: () => (
    <div className="sheet-map-story-stage">
      <div className="sheet-map-story-slot--top-right">
        <MapBackButton ariaLabel="Back to map" onPress={() => undefined} />
      </div>
    </div>
  ),
};

export const MyLocationButton: Story = {
  render: () => (
    <div className="sheet-map-story-stage">
      <div className="sheet-map-story-slot--bottom-left">
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
    <div className="sheet-map-story-stage sheet-map-story-stage--tall">
      <div className="sheet-map-story-map-fill" />
      <div
        className="sheet-map-story-overlay-preview sheet-map-visible-area"
        style={{ height: "65%" }}
      >
        <div className="sheet-map-overlay-slot--bottom-left">
          <MapMyLocationButton
            ariaLabel="Focus on my location"
            focused
            onPress={() => undefined}
          />
        </div>
      </div>
      <div className="sheet-map-story-sheet-preview" />
    </div>
  ),
};
