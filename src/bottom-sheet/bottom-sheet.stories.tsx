import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { BottomSheet, type BottomSheetSnap } from "./bottom-sheet";
import { BottomSheetCollapsedLayers } from "./bottom-sheet-collapsed-layers";

const meta = {
  title: "Patterns/BottomSheet",
  component: BottomSheet,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="relative h-[520px] overflow-hidden bg-neutral-950">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#0a0e17_0%,#141e30_100%)]" />
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BottomSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

function InteractiveSheet() {
  const [snap, setSnap] = useState<BottomSheetSnap>("half");
  const isCollapsed = snap === "collapsed";

  const peek = (
    <div className="shrink-0 px-4 py-3">
      <p className="font-semibold text-lg text-white uppercase tracking-wide">
        Bounty Intel
      </p>
      <p className="text-neutral-400 text-xs">
        Drag to expand — scroll at full
      </p>
    </div>
  );

  const expanded = (
    <div className="px-4 pb-4 pt-4">
      <p className="mb-3 text-neutral-400 text-xs">Snap: {snap}</p>
      <div className="space-y-3">
        {Array.from({ length: 12 }, (_, index) => (
          <div
            key={`sheet-tag-${index + 1}`}
            className="rounded-md border border-white/10 bg-neutral-900/50 p-3"
          >
            <p className="text-sm text-white uppercase">Tag {index + 1}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <BottomSheet snap={snap} onSnapChange={setSnap}>
      <BottomSheetCollapsedLayers
        sheetSnap={snap}
        isCollapsed={isCollapsed}
        revealExpandedWhileCollapsed={false}
        peek={peek}
        expanded={expanded}
      />
    </BottomSheet>
  );
}

export const Default: Story = {
  args: {
    children: null,
  },
  render: () => <InteractiveSheet />,
};
