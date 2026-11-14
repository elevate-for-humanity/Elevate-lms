# Admin Dashboard Commercialization Checklist

## Goal
Package Elevate Admin as a sellable product with clear gates for reliability, security, onboarding, and buyer demo-readiness.

---

## 1) MVP Sellable Feature Gate (Must pass)

### Core product capability
- [ ] Multi-role authentication and role-based access works end-to-end (admin/instructor/partner/employer/learner)
- [ ] Program + enrollment lifecycle works (apply → review → enroll → progress)
- [ ] Document workflows work (upload → review → approval/reject)
- [ ] AI operator tooling works (AI Console + Dev Studio + command execution guardrails)
- [ ] Integrations baseline works (email provider + storage + payment where applicable)

### Store/listing readiness
- [ ] Product tier definitions exist (Starter/Pro/Enterprise)
- [ ] Pricing page is internally consistent with checkout/license routes
- [ ] Demo route is live and non-broken
- [ ] Sales handoff CTA path is complete (request demo/contact)

---

## 2) Hardening Gate (Must pass before external sales)

### Reliability
- [ ] CI route audit has zero duplicate/overlapping/redirect-stub issues
- [ ] Smoke tests run in CI with a stable browser runtime
- [ ] Public APIs do not 5xx under missing non-critical envs (safe degraded behavior where intentional)
- [ ] Background jobs and cron tasks are observable and retry-safe

### Security
- [ ] Secrets are stored only in environment/secret managers (no plaintext in code)
- [ ] Secret rotation runbook exists and is tested
- [ ] Admin mutations have audit logging
- [ ] RLS assumptions are documented for high-risk tables
- [ ] Provider keys are tenant-scoped or environment-scoped appropriately

### Data + tenancy
- [ ] Tenant boundaries are explicit and tested
- [ ] Data export/import paths are permission-checked
- [ ] No cross-tenant leakage in dashboards/reports

---

## 3) Pricing Tiers Template

### Starter ($5k–$15k one-time)
- Single tenant
- Core admin + learner portal
- Basic document upload/review
- Email integration setup

### Growth ($15k–$50k one-time or annual)
- Multi-role workflows
- AI Studio (guarded operator tooling)
- Program/enrollment reporting
- Branded onboarding + migration support

### Enterprise ($50k+ / custom)
- Multi-tenant controls
- Security review artifacts
- SSO/integration extensions
- SLA + support + implementation package

> Adjust price by onboarding effort, integrations, and compliance requirements.

---

## 4) 10-Minute Buyer Demo Script

1. **00:00–01:00** — Dashboard overview (roles, metrics, workflow status)
2. **01:00–03:00** — Applicant flow (application queue → approval)
3. **03:00–05:00** — LMS/program progression (enrollment → progress visibility)
4. **05:00–06:30** — Document pipeline (upload → extract → review)
5. **06:30–08:00** — AI Studio (command + container/secrets visibility)
6. **08:00–09:00** — Integrations (email/storage/payments)
7. **09:00–10:00** — Security + audit + implementation timeline

---

## 5) “Already Built vs Verify” Repo Audit Prompts

Use these before building new features:

- Search for existing route before adding a new one
- Confirm no overlap via route audit scripts
- Confirm setting key already exists in `platform_settings` before adding a new key
- Confirm storage helper exists before hardcoding URLs
- Confirm integration route already exists before creating duplicate providers

Suggested commands:

```bash
pnpm -s route:audit
pnpm -s check:redirects
pnpm -s integrity:links
pnpm -s audit:admin
```

---

## 6) Next Implementation Sequence (for your current goals)

1. Document upload pipeline → structured extraction store
2. Prefill mapping engine (org facts + user facts + custom vars)
3. Editable variable registry UI in Admin
4. Secrets wiring from Dev Studio/Settings to runtime integrations
5. Signing + outbound email orchestration
6. CI hardening (prebaked Playwright browser image)

