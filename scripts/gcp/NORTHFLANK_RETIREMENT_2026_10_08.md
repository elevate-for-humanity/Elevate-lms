# Northflank to Google verification — October 8, 2026

No Northflank service, volume, secret group or project has been deleted.

| Component | Resolved runtime values matched on Google | Google-owned configuration readback | Remaining retirement evidence |
|---|---:|---|---|
| LMS | 70 | Passed | Functional student and course tests; recovery without source credentials |
| Admin | 81 | Passed | New Google build, completed video render and dashboard tests |
| Marketing | 66 | Passed | Exact public revision and video playback tests |
| Store | 10 | Passed | Billing and store route acceptance |
| Course worker | 21 | Passed; narration adapted to Kokoro | Finished course/video execution and scheduling acceptance |
| Studio | Not compared to a live replacement | Passed; one source volume recorded | Google runtime absent; auth volume and workspace transfer; provider and restart tests |

The live Google inventory contains the PBX VM and its disk, six runtime configuration secrets, no Studio VM or disk, no snapshots and no Cloud Scheduler jobs. The existing database cron is a separate scheduling mechanism.

All 23 standalone secret groups were inventoried across elevate-platform and elevate-media-gpu. Their proposed Google destinations could not be created/accessed: permission_denied. This does not mean the active application credentials are absent: all six application configuration readbacks match the source. Detached secret groups still require independent preservation before deleting Northflank.

Run scripts/gcp/bootstrap-source-secret-groups.sh in Google Cloud Shell as the project administrator. It creates only the 23 empty destinations and grants the importer viewer, version-add and payload-read roles on those individual secrets. It does not expose payloads, overwrite versions, change runtime services or delete source resources. Then run Import runtime configuration into Google ownership with component all.

Ten legacy source deployment workflows were removed. Source inventory and transfer code remain available for migration. Full retirement, all source operations removal and functional acceptance are unfinished.

Evidence:
- [Live source / runtime comparison](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37806914381)
- [Six configuration readbacks and 23 attempted group transfers](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37807695000)
- [Google ownership inventory](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37807851152)
- [Google Admin build](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37807295076)

35 focused migration tests passed locally. Marketing TypeScript validation passed locally. These checks do not establish production functional acceptance.
