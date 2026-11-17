# Google Cloud migration — E2E service configuration diagnosis (2026-11-17)

## What was observed
- Production is Google Cloud Run, but `.github/workflows/e2e-desktop-chrome.yml` launches **local Next development servers** on ports 3000 (Marketing), 3001 (Admin), and 3002 (LMS). It is not evidence of the deployed Google image or revision.
- The two PARIS PRs #2676/#2677 each ran 480 tests with one Playwright worker and two retries, generating hundreds of failed test attempts. Both timed out/cancelled after about two hours. Logs include Next.js WebServer `ECONNRESET` / `aborted`; these are not yet attributed to a specific service, upstream, or request.
- Both runs logged `TEST_ADMIN_EMAIL/PASSWORD not set — skipping authenticated Admin warm-up`. The broad suite still attempted authenticated Admin specs. `portal-responsive-design.spec.ts` separately expects `E2E_ADMIN_*` and `E2E_PROGRAM_HOLDER_*`, while the previous workflow only provided `TEST_*` aliases.
- Before this correction the full local-dev suite could receive repository-level production Supabase secrets even though some tests create/update application records using a service-role client. **Do not test data writes against the production learner database.**
- Dockerfiles `Dockerfile.admin`, `Dockerfile.lms`, `Dockerfile.marketing` and trusted `deploy-admin.yml` build/deploy separate Cloud Run runtime images; their resources/secrets are *not inherited* by a GitHub-hosted Playwright container.
- The Admin production entrypoint is `apps/admin/server.js`, but CI Playwright uses `pnpm --filter @elevate/admin dev --port 3001`, which runs `next dev`. Therefore a green local E2E is not live Cloud Run acceptance, and a local `ECONNRESET` does not independently establish a Google production outage.

## Source configuration contract
1. For broad local-dev E2E, provision **separate QA Supabase project** credentials in GitHub Actions as `E2E_SUPABASE_URL`, `E2E_SUPABASE_ANON_KEY`, and `E2E_SUPABASE_SERVICE_ROLE_KEY`. The production project `cuxzzpsyufcewtmicszk` is explicitly prohibited for this workflow.
2. Provision dedicated QA personas: `E2E_ADMIN_EMAIL/PASSWORD`, `E2E_LEARNER_EMAIL/PASSWORD`, `E2E_PROGRAM_HOLDER_EMAIL/PASSWORD`, `E2E_HOST_SHOP_EMAIL/PASSWORD`. All must actually exist in the isolated QA environment with their corresponding role and enrollment/host-shop fixtures; copying a real learner/admin account is not acceptable.
3. Do not set `PLAYWRIGHT_BASE_URL` or `PLAYWRIGHT_<APP>_URL` on the *local* full-suite workflow. These are for separate deployed-environment browser acceptance, scoped to safe QA personas and controlled datasets.
4. Fail immediately and visibly if credentials/origins are missing or production Supabase is selected. No credential values are printed by the preflight. Test-run cancellation is not success.
5. The broad suite stops with **failure** after a bounded number of failed attempts, rather than consuming the entire 120-minute budget on repeated invalid environment results. All mandatory tests must still pass for a successful conclusion; unrun tests never count as passed.
6. Production release acceptance must independently verify the **exact** Git SHA, image digest, Cloud Run revision and serving traffic for all affected Admin/LMS/Marketing services, then run scoped authenticated deployed-runtime browser acceptance. Preserve downstream media, student records, ownership, publication and approval controls.

## Outstanding evidence / not claimed
- GitHub Actions QA secrets and the independent QA project are **not provisioned by this PR**. A preflight failure naming missing variables is an actionable setup blocker, not permission to use production secrets.
- The originating Next.js request, root cause and exact service behind each `ECONNRESET` remain unknown: capture service-labelled request/exception logs and request IDs in an isolated reproduction before application changes.
- Resource contention is plausible: one GitHub runner starts three `next dev` processes, and `NODE_OPTIONS=--max-old-space-size=6144` is inherited by each. This is an upper bound per process, **not proof of observed OOM**. Inspect RSS, memory pressure and process exits before adjusting limits or splitting jobs.
- The separate live Studio composer font/viewport and HVAC video aspect-ratio acceptance failures require independent source fixes. Do not suppress those tests.
- No attempt counters or PARIS job statuses are changed by these test configuration corrections.

## Exact evidence
- GitHub E2E runs: 44015081582 (PR #2676) and 44015741149 (PR #2677).
- Live acceptance and Cloud Run image checks are already handled by dedicated protected Google deployment and production acceptance workflows; do not substitute this local-dev E2E result.
