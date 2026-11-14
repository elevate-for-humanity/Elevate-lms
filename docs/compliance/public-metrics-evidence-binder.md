# Public Metrics Evidence Binder (Internal)

**Audience:** Compliance staff, grant writers, DWD/WorkOne reviewers, auditors  
**Public summary:** `/impact/methodology`  
**Last updated:** 2026-06

## Purpose

Maps every **public-facing metric or compliance claim** on elevateforhumanity.org to a substantiating source. Do not publish new headline statistics without adding a row here and updating `/impact/methodology`.

## Hosting & production

| Claim | Evidence | Owner |
|-------|----------|-------|
| Production on Northflank (`elevate-lms`, `elevate-admin`) | `.github/workflows/deploy-lms.yml`, `deploy-admin.yml`; `node scripts/verify-no-aws-deploy.mjs` | DevOps |
| No AWS ECS deploy from repo | CI guard + `docs/audits/aws-ecs-decommission-2026-06.md` | DevOps |

## Workforce compliance

| Claim | Evidence | Owner |
|-------|----------|-------|
| Indiana ETPL provider | DWD ETPL listing letter / screenshot (secure drive) | Compliance |
| DOL registered apprenticeship sponsor | DOL registration letter, RAPIDS sponsor ID | Apprenticeship |
| WIOA-aligned programs | Program ETPL crosswalk per credential | Compliance |
| WorkOne partner | MOU / referral agreements (secure drive) | Partnerships |

## Testing & credentials (third-party)

| Claim | Evidence | Owner |
|-------|----------|-------|
| Certiport CATC | Certiport authorization letter | Testing |
| ACT WorkKeys (Realm 1317721865) | ACT authorization documentation | Testing |
| HSI authorized training | HSI center agreement (if applicable) | Safety/Healthcare |

## Outcome metrics (dynamic)

| Public surface | DB / source | Query notes |
|----------------|-------------|-------------|
| Learners served (`HomeOutcomes`) | `program_enrollments` | Active + completed; see `loadVerifiedPublicStats()` |
| Credentials issued | `program_completion_certificates`, `certificates` | Union count; de-dupe in exports |
| Completion rate | `program_enrollments.status = completed` | Exclude 14-day withdrawals per methodology |
| Placement / career services | `platform_stats` or surveys | Self-reported unless employer-confirmed |
| Program count | `programs` published + active | `loadVerifiedProgramCount()` |

## Testimonials

| Surface | Source | Requirement |
|---------|--------|-------------|
| `HomeOutcomes` | `testimonials` table (`published`, `featured`) | Written consent on file |
| `SocialProof` / `VideoTestimonials` | `testimonials` + `platform_stats` | No fabricated counts; use `—` when empty |

## Reviewer packet checklist

When a workforce agency requests substantiation:

1. Cover letter with methodology link (`/impact/methodology`)
2. ETPL approval excerpt (redact unrelated programs if needed)
3. DOL apprenticeship registration (if apprenticeship cited)
4. De-identified enrollment/completion export for cited period
5. Credential issuance log (certificate IDs verifiable at `/verify/[id]`)
6. Funding source MOU summary (WIOA/WRG/IMPACT as applicable)

## Change control

- Update this binder **before** changing homepage stats, hero copy, or grant narratives.
- Run `pnpm vitest run tests/unit/platform-template-leaks.test.ts` after marketing copy changes.
