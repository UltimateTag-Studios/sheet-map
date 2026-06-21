# @siegetag/sheet-map

Rebuild in progress. Read [README.md](./README.md) for phase order.

- Reference implementation (frozen): `packages/sheet-map-old`
- Do not import from `@siegetag/sheet-map-old` in this package
- Each phase: tests first, then demo proof, then bump `SHEET_MAP_REBUILD_PHASE`

After code changes, from repo root:

```bash
pnpm lint:fix
pnpm --filter @siegetag/sheet-map test
```
