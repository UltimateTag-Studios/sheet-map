/** Rebuild phase marker for demo + CI. Bump when a phase lands. */
export const SHEET_MAP_REBUILD_PHASE = 3 as const;

/** Phase 4 sub-part (1–5). See `docs/phase-4-parts.md`. Removed when phase 4 completes. */
export const SHEET_MAP_PHASE_4_PART = 1 as const;

export * from "./camera";
export * from "./canvas";
export * from "./shell";
export * from "./viewport";
