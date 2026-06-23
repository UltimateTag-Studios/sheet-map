/** Semantic theme token names — override in app CSS after bundled styles. */
export const SHEET_MAP_THEME_VARS = {
  colorCanvasGutter: "--sheet-map-color-canvas-gutter",
  colorAction: "--sheet-map-color-action",
  colorActionHover: "--sheet-map-color-action-hover",
  colorActionFocusRing: "--sheet-map-color-action-focus-ring",
  colorLocationButtonBorder: "--sheet-map-color-location-button-border",
  colorLocationButtonBackground: "--sheet-map-color-location-button-background",
  colorLocationButtonBackgroundHover:
    "--sheet-map-color-location-button-background-hover",
  colorLocationButtonText: "--sheet-map-color-location-button-text",
  colorLocationButtonActiveBorder:
    "--sheet-map-color-location-button-active-border",
  colorLocationButtonActiveBackground:
    "--sheet-map-color-location-button-active-background",
  colorLocationButtonActiveBackgroundHover:
    "--sheet-map-color-location-button-active-background-hover",
  colorLocationButtonActiveText:
    "--sheet-map-color-location-button-active-text",
  colorLocationMarker: "--sheet-map-color-location-marker",
  colorLocationMarkerHalo: "--sheet-map-color-location-marker-halo",
  colorItemMarkerDefault: "--sheet-map-color-item-marker-default",
  colorItemMarkerStroke: "--sheet-map-color-item-marker-stroke",
  colorItemMarkerGlow: "--sheet-map-color-item-marker-glow",
  colorItemMarkerGlowSelected: "--sheet-map-color-item-marker-glow-selected",
  colorHeaderText: "--sheet-map-color-header-text",
  colorBodyText: "--sheet-map-color-body-text",
  colorListItemBorder: "--sheet-map-color-list-item-border",
  colorListItemBackground: "--sheet-map-color-list-item-background",
  colorListItemBorderHover: "--sheet-map-color-list-item-border-hover",
  colorListItemBackgroundHover: "--sheet-map-color-list-item-background-hover",
  colorListItemBorderSelected: "--sheet-map-color-list-item-border-selected",
  colorListItemShadowSelected: "--sheet-map-color-list-item-shadow-selected",
  colorFocusRing: "--sheet-map-color-focus-ring",
  colorOverlayCardBackground: "--sheet-map-color-overlay-card-background",
  colorOverlayCardShadow: "--sheet-map-color-overlay-card-shadow",
  colorOverlayCardText: "--sheet-map-color-overlay-card-text",
  colorSpinnerTrack: "--sheet-map-color-spinner-track",
  colorSpinnerAccent: "--sheet-map-color-spinner-accent",
  fontHeaderEyebrowSize: "--sheet-map-font-header-eyebrow-size",
  fontHeaderTitleSize: "--sheet-map-font-header-title-size",
  fontHeaderTitleWeight: "--sheet-map-font-header-title-weight",
  fontHeaderCountSize: "--sheet-map-font-header-count-size",
  fontHeaderEyebrowOpacity: "--sheet-map-font-header-eyebrow-opacity",
  fontHeaderCountOpacity: "--sheet-map-font-header-count-opacity",
  fontListTitleSize: "--sheet-map-font-list-title-size",
  fontListTitleWeight: "--sheet-map-font-list-title-weight",
  fontListSubtitleSize: "--sheet-map-font-list-subtitle-size",
  fontListSubtitleOpacity: "--sheet-map-font-list-subtitle-opacity",
  fontListMetaSize: "--sheet-map-font-list-meta-size",
  fontListMetaOpacity: "--sheet-map-font-list-meta-opacity",
} as const;

export const SHEET_MAP_LOGO_REGION_BOTTOM_INSET_VAR =
  "--sheet-map-logo-region-bottom-inset" as const;

export const SHEET_MAP_LOGO_INSET_VARS = {
  top: "--sheet-map-logo-top",
  right: "--sheet-map-logo-right",
  bottom: "--sheet-map-logo-bottom",
  left: "--sheet-map-logo-left",
} as const;
