# Google production deployment checklist

Production is Google Cloud project `elegant-racer-299721`. Deployments build from `main`; no Northflank deployment or webhook is a production release path.

## Service ownership

| Component | Google target | Automatic workflow |
|---|---|---|
| Marketing | elevate-marketing-migration | deploy-google-marketing-trigger.yml |
| Admin | elevate-admin-migration | deploy-admin.yml |
| LMS | elevate-lms-migration | deploy-google-lms-trigger.yml |
| Store | elevate-store-migration | deploy-google-store-runtime.yml |
| Course Builder | elevate-course-builder Cloud Run Job | deploy-google-course-worker.yml; dispatch-google-course-job.yml |
| Studio browser | Google Cloud Run and the browser HTTPS gateway | repair-google-studio-browser.yml; audit-google-studio-browser.yml |

Runtime configuration belongs to Google Secret Manager. Supabase remains the database; Google hosting does not replace its data or authentication.

## Release

1. Commit the complete change to main. Studio engineering publishes the completed task with a non-force update and refuses concurrent-main conflicts; it does not create a PR.
2. The applicable source-path workflow validates and builds the image, uploads an immutable digest, checks the candidate, and activates verified traffic.
3. Confirm the image commit, ready revision, public domain routing and live Supabase dependency health. Dispatch acceptance or a successful build alone is not successful deployment.
4. Marketing, Admin and Store supersede older release runs. GitHub runner availability can still cause a temporary queue. Never remove health or authentication checks to label a failing release successful.

Manual compatibility command: `node scripts/gcp/dispatch-release.mjs admin` (or marketing, lms, store, course-builder). It dispatches the current main only; it does not report the service as live.

## Acceptance

- Check public and portal routes, authentication and appropriate access boundaries.
- Verify application intake, dashboards, real courses and learner playback using controlled records.
- Verify billing, webhook and enrollment behavior through the current billing implementation; do not treat historical provider checklists as proof.
- Check email, phone and scheduled operations without sending unrequested messages or calls.
- Inspect current Google deployment logs and the final live revision.

## Migration and rollback

Preserve rollback revisions and source evidence. Historical source metadata and one-time exports are read-only migration boundaries, not deployment dependencies.
The encrypted Studio authentication files and uncommitted source workspace require content-transfer and recovery evidence before source data can be retired.
All outstanding acceptance requirements remain in issue #674.
Use a previously verified Google image/revision for rollback; do not redeploy the source provider.
