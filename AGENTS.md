# @siegetag/sheet-map

Fresh rebuild. Read [docs/rebuild-phases.md](./docs/rebuild-phases.md) for step-by-step work per phase. Camera behavior: [docs/camera-fsm-plan.md](./docs/camera-fsm-plan.md).

- Abandoned attempt: `packages/sheet-map-old` (`@siegetag/sheet-map-previous`) — do not import
- Capacitor reference: `packages/sheet-map-old-old` (`@siegetag/sheet-map-old`)
- Each phase: tests first, demo proof, bump `SHEET_MAP_REBUILD_PHASE`

After code changes, from repo root:

```bash
pnpm lint:fix
pnpm --filter @siegetag/sheet-map test
```
