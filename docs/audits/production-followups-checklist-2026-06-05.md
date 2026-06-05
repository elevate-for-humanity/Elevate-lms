# Production follow-ups checklist (2026-06-05)

## Done in repo (merged #265, #266)

- [x] Large course MP4 → R2 when `CLOUDFLARE_R2_*` set (`COURSE_VIDEO_STORAGE_BACKEND=auto`)
- [x] Cosmetology weekly Stripe + `cosmetology_subscriptions` on `cosmetology_enrollment`
- [x] Remotion bundle release after render
- [x] Cron trim (weekly for low-frequency jobs; testing-lead daily)
- [x] `scripts/migrate-course-videos-to-r2.ts`
- [x] Audit fallback file cap (2MB)
- [x] Northflank health probes in deploy CI
- [x] Closed superseded PRs #249, #225, #201, #196

## You must do in dashboards

| Step | Where |
|------|--------|
| Add R2 keys to Northflank `elevate-production-env` | Northflank → Secrets (or Cursor secrets + `sync-env --execute`) |
| Set `CLOUDFLARE_R2_PUBLIC_URL` | e.g. `https://media.elevateforhumanity.org` |
| Delete unused GitHub secrets `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | GitHub → Settings → Secrets (not used by workflows) |
| Decommission ECS if still running | AWS Console (repo has no deploy-aws.yml) |
| Wait for green **Deploy production (both services)** | GitHub Actions |
| Optional: migrate old MP4s | `pnpm tsx scripts/migrate-course-videos-to-r2.ts --execute` |

## Verify

```bash
pnpm tsx scripts/northflank/verify-deployed-sha.ts
pnpm tsx scripts/northflank/verify-health-checks.ts
curl -s https://www.elevateforhumanity.org/api/ping
curl -s https://admin.elevateforhumanity.org/api/ping
```
