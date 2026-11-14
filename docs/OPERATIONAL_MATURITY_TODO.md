# Operational Maturity Todo

Last updated: 2026-05-09

## Completed Baseline

- Auth gap audit passes.
- Schema reference audit passes.
- Env var audit passes.
- Link integrity passes.
- Analytics integrity passes.
- Self-service policy integrity passes.
- Integration readiness checker passes.
- Reliability guard passes.
- Workflow failure checker passes.

## Remaining Work (Not Done Yet)

- [ ] Program canonical completeness rollout
- [ ] Program DB backfill migration for missing canonical rows (`program_media`, `program_ctas`, `program_tracks`, `program_modules`)
- [ ] Apply migration manually in Supabase Dashboard and verify row counts
- [ ] Re-run strict program integrity gate (`pnpm run integrity:programs:strict`) to zero failures
- [ ] Full production build completion in CI/runtime-constrained environment (`pnpm build`)
- [ ] Verify `verify:system` without `.next` warning after successful build

## Evidence Outputs

- Program integrity report JSON: `audit-packet/program-integrity-report.json`

## Execution Notes

- Default `integrity:programs` now reports all gaps and writes a machine-readable report.
- Use strict mode for release readiness enforcement:
  - `pnpm run integrity:programs:strict`
