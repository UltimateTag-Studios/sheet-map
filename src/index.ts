/** Rebuild phase marker for demo + CI. Bump when a phase lands. */
export const SHEET_MAP_REBUILD_PHASE = 4 as const;

/** Phase 5 sub-part (1–5). See `docs/phase-5-parts.md`. Removed when phase 5 completes. */
export const SHEET_MAP_PHASE_5_PART = 4 as const;

export * from "./camera";
export * from "./canvas";
export * from "./shell";
export * from "./viewport";
