# Schema Audit

Generated: 2026-03-27  
Auditor: Ona

---

## LMS Tables

| Table | Purpose | Code Refs | Migration Source | Status |
|-------|---------|----------|-----------------|--------|
| `curriculum_lessons` | DB-driven lesson store with `step_type`, `module_order`, `lesson_order` | 15 | `20260312900000_admin_platform_expansion.sql` | **Canonical** |
| `training_lessons` | Legacy HVAC lesson store (94 rows) | 97 | `20260217000001_lms_operational_readiness.sql` | Legacy — HVAC only |
| `lms_lessons` (view) | Unified lesson source: `curriculum_lessons` UNION `training_lessons` | 10 | `20260322000010_lms_lessons_view.sql`, rebuilt in `20260327000002` | **Canonical view** |
| `modules` | Module definitions (`title`, `slug`, `program_id`) | 12 | `20260312900000_admin_platform_expansion.sql` | **Canonical** |
| `lesson_progress` | Per-user lesson completion (`user_id`, `lesson_id`, `completed`, `completed_at`) | 44 | `20260124000004_pwa_tables.sql` | **Canonical** |
| `completion_rules` | Per-course/program completion rule definitions | ~5 | `20260313900004_program_progress_engine.sql` | **Canonical** |

## Missing LMS Tables (required for checkpoint gating)

| Table | Required For | Status |
|-------|-------------|--------|
| `checkpoint_scores` | Record pass/fail per checkpoint step per learner | **Missing — create in Phase 8** |
| `step_submissions` | Lab/assignment submission + instructor sign-off | **Missing — create in Phase 8** |
| `passing_score` column on `curriculum_lessons` | Per-lesson pass threshold (default 70) | **Missing — add in Phase 8** |

---

## Enrollment Tables (3 — fragmented)

| Table | Code Refs | Purpose | Status |
|-------|----------|---------|--------|
| `program_enrollments` | 449 | **Canonical** — primary enrollment record | Use for all new code |
| `training_enrollments` | 68 | LMS operational (attendance, cohort, progress %) | Active — LMS uses this for progress tracking |
| `enrollments` (view) | 24 | Compatibility view → `program_enrollments` | Legacy compat — do not write to |
| `student_enrollments` | 36 | Barber/apprenticeship-specific enrollment with hours tracking | Distinct purpose — keep |

**Note:** `student_enrollments` is not a duplicate of `program_enrollments` — it tracks apprenticeship hours (`required_hours`, `transfer_hours`, `has_host_shop`). Keep both.

---

## Certificate Tables (fragmented — 8 tables with no migration source)

| Table | Code Refs | Migration Source | Status |
|-------|----------|-----------------|--------|
| `certificates` | 95 | `20260227000003_schema_governance_baseline.sql` | **Canonical** cert record |
| `certification_requests` | 18 | `20260326000001_certification_pipeline.sql` | Active — workflow requests |
| `credential_registry` | 17 | `20260317000002_credential_registry.sql` | Active — external credential definitions |
| `program_credentials` | 14 | `20260322000005_program_credentials_seed.sql` | Active — program→credential mapping |
| `learner_credentials` | 10 | `20260317000002_credential_registry.sql` | Active — per-learner credential records |
| `exam_funding_authorizations` | ~5 | `20260321000001_exam_funding_authorizations.sql` | Active — created by eligibility check |
| `issued_certificates` | 6 | **No migration found** | Unknown — may be created by app code |
| `program_completion_certificates` | 1 | **No migration found** | Used by `/verify/[certificateId]` page |
| `user_credentials` | 3 | **No migration found** | Unknown |
| `credentials_attained` | 2 | **No migration found** | Unknown |
| `external_credentials` | 1 | **No migration found** | Unknown |
| `certification_types` | 1 | **No migration found** | Unknown |
| `cert_revocation_log` | 1 | **No migration found** | Unknown |
| `certificate_downloads` | 1 | **No migration found** | Unknown |

**Problem:** 8 certificate-related tables are referenced in code but have no migration source. They may have been created via the Supabase Dashboard directly, or via migrations that were applied but not committed. These cannot be verified from the repository alone.

**Action:** Cannot delete. Document as unverifiable from code. The canonical cert record is `certificates`.

---

## Credential / Exam Tables

| Table | Code Refs | Migration Source | Status |
|-------|----------|-----------------|--------|
| `credential_exam_domains` | 3 | `20260322000004_credential_exam_domains.sql` | Active — domain linkage for lessons |
| `credential_attempts` | 9 | `20260322000004_credential_exam_domains.sql` | Active |
| `certiport_exam_requests` | 4 | Unknown | Unknown |
| `program_certification_pathways` | 2 | `20260326000002_certification_pathways.sql` | Active |

---

## Progress Tables

| Table | Code Refs | Purpose | Status |
|-------|----------|---------|--------|
| `lesson_progress` | 44 | Per-lesson completion | **Canonical** |
| `progress_entries` | 40 | General progress entries | Active — distinct from lesson_progress |
| `completion_rules` | ~5 | Rule definitions per course/program | **Canonical** |

---

## Problems Found

1. **8 cert tables with no migration source** — cannot verify schema from repo. Must be confirmed in Supabase Dashboard.
2. **`checkpoint_scores` and `step_submissions` missing** — required for checkpoint gating. Create in Phase 8.
3. **`passing_score` column missing from `curriculum_lessons`** — required for checkpoint gating. Add in Phase 8.
4. **`lms_lessons` view exposes `passing_score` as `NULL::integer`** — must be updated after column is added.
5. **`training_lessons` still has 97 code references** — HVAC content should eventually migrate to `curriculum_lessons`, but this is a long-term migration, not Phase 8 work.
6. **`issued_certificates` vs `certificates`** — two tables serving overlapping purposes. Canonical is `certificates`. `issued_certificates` origin unknown.

---

## Actions Taken

- Phase 8: Create `checkpoint_scores`, `step_submissions`, add `passing_score` to `curriculum_lessons`, rebuild `lms_lessons` view to expose `passing_score`
- Phase 8: Wire auto-certificate issuance on completion
- No speculative tables created
