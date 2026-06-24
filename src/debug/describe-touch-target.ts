export type TouchTargetClassification = {
  inSheet: boolean;
  inOverlaySlot: boolean;
  inMapCanvas: boolean;
  isMapControl: boolean;
};

const MAP_CONTROL_SELECTOR =
  ".sheet-map-action-button, .sheet-map-location-button, .sheet-map-item-marker, .mapboxgl-canvas";

/** Short selector-like label for console probes. */
export function describeTouchTarget(node: EventTarget | null): string | null {
  if (!(node instanceof Element)) {
    return null;
  }

  const parts: string[] = [node.tagName.toLowerCase()];

  if (node.id) {
    parts.push(`#${node.id}`);
  }

  const classes = Array.from(node.classList).slice(0, 5);
  if (classes.length > 0) {
    parts.push(`.${classes.join(".")}`);
  }

  if (node instanceof HTMLElement) {
    const ariaLabel = node.getAttribute("aria-label");
    if (ariaLabel) {
      parts.push(`[aria-label="${ariaLabel}"]`);
    }
  }

  return parts.join("");
}

export function classifyTouchTarget(
  node: EventTarget | null,
): TouchTargetClassification {
  if (!(node instanceof Element)) {
    return {
      inSheet: false,
      inOverlaySlot: false,
      inMapCanvas: false,
      isMapControl: false,
    };
  }

  return {
    inSheet: node.closest(".sheet") !== null,
    inOverlaySlot: node.closest(".sheet-map-visible-area-overlay") !== null,
    inMapCanvas: node.closest(".sheet-map-canvas-root") !== null,
    isMapControl: node.matches(MAP_CONTROL_SELECTOR),
  };
}
