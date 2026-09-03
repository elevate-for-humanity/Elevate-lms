# Admin Dashboard Remediation TODO (Execution Plan)

Last updated: 2026-05-21

This list is derived from repo audits and the recent stabilization work. It is ordered by execution priority.

## Phase 1 — Reliability & Route Integrity (Do first)
- [x] Route overlap audit clean (`route:audit`)
- [x] Redirect conflict audit clean (`check:redirects`)
- [x] Link integrity audit clean (`integrity:links`)
- [x] Admin audit violation fixed in provider apply route (`getAdminClient` + null guard)
- [x] Public enrollment count safe degraded response added for env-missing test containers
- [ ] CI browser runtime hardened (prebaked Playwright browser image)
- [x] CI required-env precheck before smoke/e2e

## Phase 2 — Admin Tooling Hardening
- [x] AI Studio unified entry route added (`/admin/ai-studio`)
- [x] AI nav points to unified hub first
- [x] DevStudio app-dir discovery hardened for monorepo roots
- [x] DevStudio GitHub workflow dispatch verification checklist (token scopes + runtime env + run URL confirmation)
- [ ] Add automated test for DevStudio command dispatch error paths

## Phase 3 — Course Builder / Grants / Prefill Completion
- [ ] Complete Google Form `entry.*` mapping in grants apply prefill flow (currently only one confirmed ID)
- [ ] Add validation test to fail if unconfirmed field mapping remains for production mode
- [x] Add admin UI note/status badge showing mapping completeness

## Phase 4 — Documents + AI Prefill Pipeline (Core product goal)
- [ ] Persist uploaded docs into structured extraction store
- [ ] Variable registry (editable) in admin UI
- [ ] Prefill engine joins org/profile facts + custom variables
- [ ] Review/approve step before outbound doc generation/signing
- [ ] Outbound email orchestration + delivery status

## Phase 5 — Commercialization Gate
- [x] Commercialization checklist added in repo docs
- [x] Checklist surfaced in Admin Advanced Tools
- [ ] Tenant isolation verification suite
- [x] Onboarding runbook: “new customer live in 2 hours”
- [x] Security/secret handling runbook and periodic rotation SOP

---

## Commands to run each cycle

```bash
pnpm -s route:audit
pnpm -s check:redirects
pnpm -s integrity:links
pnpm -s audit:admin
pnpm -s eslint app/api/provider/apply/route.ts
```

## Notes
- This plan intentionally separates **already completed** remediation from **remaining work**.
- Do not rebuild existing modules without confirming current route/feature ownership first.
