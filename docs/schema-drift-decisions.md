# Schema Drift Decision Sheet

Generated from live DB introspection + migration audit + app code grep.
Each row is a table with two competing migration definitions.

**Legend**
- **Live shape** = what Supabase actually has right now
- **First def** = earliest migration that defines this table
- **Later def** = later migration that re-defines it (masked by IF NOT EXISTS)
- **App expects** = columns referenced in .ts/.tsx files
- **Canonical target** = chosen going-forward shape
- **Migration needed** = what ALTER TABLE work is required

---

## 1. `documents`

| | |
|---|---|
| Live shape | 30 cols — matches the **later** definition (`20260227000003_schema_governance_baseline.sql`) |
| First def | `20260128000001_barber_apprenticeship_system.sql` — 15 cols, `owner_type/owner_id/file_path/file_size_bytes/uploaded_at` |
| Later def | `20260227000003` — 30 cols, adds `user_id/file_url/file_size/status/enrollment_id/application_id/verification_status/title/url` |
| App expects | `user_id` (41 refs), `file_path` (14), `file_url` (7), `owner_type` (6), `owner_id` (5), `file_size` (3) |
| **Verdict** | Live = later def. App uses columns from both. No migration needed — live already has all referenced columns. |
| Migration needed | None. Both column sets exist in live. |

---

## 2. `tax_clients`

| | |
|---|---|
| Live shape | 17 cols — **neither** migration definition exactly. Live has `firm_id`, `office_id`, `preparer_id`, `tenant_id`, `ssn_last_four`, `preparation_fee`, `refund_amount` — a merged/evolved shape |
| First def | `20260124150000` — 25 cols, user-centric (address, spouse fields, bank encryption) |
| Later def | `20260317000003_tax_core.sql` — 11 cols, firm-centric (`firm_id`, `dob`) |
| App expects | `ssn_last4` (5), `firm_id` (4), `ssn_hash` (3), `dob` (1), `date_of_birth` (1) |
| **Verdict** | Live is a third shape — evolved beyond both definitions. App uses `firm_id` (live has it), `ssn_last4` (live has it), `ssn_hash` (live has it), `dob` (live has it). App also references `date_of_birth` (1 ref) — live has `dob` not `date_of_birth`. |
| Migration needed | Add `date_of_birth DATE` as alias or update the 1 app reference to use `dob`. Recommend: update app code, no migration. |

---

## 3. `tax_returns`

| | |
|---|---|
| Live shape | 33 cols — evolved shape with `drake_return_id`, `jotform_submission_id`, `has_w2/1099/self_employment`, `public_tracking_code` — not in either migration |
| First def | `20260124150000` — 23 cols, `user_id`-centric, `filing_status/total_income/dcn/rejection_errors` |
| Later def | `20260317000003` — 13 cols, has duplicate `status` column (syntax error), `firm_id/office_id/return_json` |
| App expects | `status` (14), `user_id` (5), `filing_status` (4), `client_id` (4), `firm_id` (3), `return_json` (2), `preparer_user_id` (1) |
| **Verdict** | Live has all app-referenced columns. Later def's duplicate `status` column was a syntax error that never ran. Live is the canonical shape. |
| Migration needed | None for live. Remove duplicate `status` from `20260317000003_tax_core.sql` (already fixed by comma audit). |

---

## 4. `wioa_participants`

| | |
|---|---|
| Live shape | 83 cols — massively expanded beyond both definitions. Full PIRL-compliant eligibility record. |
| First def | `20260217000004` — 21 cols, `user_id`-centric |
| Later def | `20260320000009` — 26 cols, `learner_id`-centric |
| App expects | `eligibility_status` (6), `user_id` (4), `last_name` (4), `first_name` (3) |
| **Verdict** | Live is the canonical shape — 83 cols, has `user_id` (app uses it), `first_name/last_name/eligibility_status`. The `learner_id` rename in the later def never took effect. |
| Migration needed | None. Live has all app-referenced columns. |

---

## 5. `wioa_participant_records`

| | |
|---|---|
| Live shape | 23 cols — matches the **first** definition (`20260217000001_lms_operational_readiness.sql`) exactly |
| First def | `20260217000001` — 23 typed cols (reporting period, demographics, outcomes) |
| Later def | `20260320000009` — 7 cols, EAV-style (`field_name/field_value/data_source`) — completely different purpose |
| App expects | 4 files reference it; no specific column greps returned hits |
| **Verdict** | Live = first def. Later EAV redesign never ran and should not run — it would destroy the typed schema. |
| Migration needed | None. Later def should be commented out to prevent accidental application. |

---

## 6. `pages`

| | |
|---|---|
| Live shape | 10 cols — matches the **first** definition (`20260224000003_create_pages_table.sql`): `path/title/description/section/is_published/requires_auth/roles_allowed` |
| First def | `20260224000003` — 10 cols, `path`-based |
| Later def | `20260322000001_page_builder_engine.sql` — 8 cols, `slug/status/meta_title/meta_desc` |
| App expects | `slug` (6 refs), `status` (4 refs) — app expects the **later** shape |
| **Verdict** | Live has the first shape. App code expects `slug` and `status` which do not exist in live. This is a live bug — queries on `slug` and `status` are silently returning nothing or erroring. |
| Migration needed | **ADD** `slug TEXT`, `status TEXT DEFAULT 'published'`, `meta_title TEXT`, `meta_desc TEXT`. Backfill `slug` from `path`. |

---

## 7. `placement_records`

| | |
|---|---|
| Live shape | 16 cols — matches the **later** definition (`20260328000005_placement_records.sql`): `learner_id/case_manager_id/employer_name/start_date/verification_method` |
| First def | `20260320000004` — 22 cols, has `employer_id/enrollment_id/hire_date/annual_salary/verification_source/employed_q2/employed_q4` |
| Later def | `20260328000005` — 16 cols |
| App expects | `start_date` (7), `employer_name` (6), `hire_date` (5), `employer_id` (5), `case_manager_id` (4), `verification_source` (2), `enrollment_id` (2), `annual_salary` (1) |
| **Verdict** | Live = later def. But app references `hire_date` (5), `employer_id` (5), `enrollment_id` (2), `annual_salary` (1), `verification_source` (2) — none of which exist in live. These are live bugs. |
| Migration needed | **ADD** `hire_date DATE`, `employer_id UUID`, `enrollment_id UUID`, `annual_salary NUMERIC`, `verification_source TEXT`. |

---

## 8. `messages`

| | |
|---|---|
| Live shape | 11 cols — matches the **first** definition: `read/conversation_id/deleted_by/read_by` |
| First def | `20260227000003` — 11 cols, `read/conversation_id/deleted_by/read_by` |
| Later def | `20260503000003_webinars_messages.sql` — 11 cols, `is_read/thread_id/parent_id/updated_at` (renames + additions) |
| App expects | `read` (12), `conversation_id` (6), `read_by` (5), `deleted_by` (4), `is_read` (3) |
| **Verdict** | Live = first def. App uses both `read` (12 refs) and `is_read` (3 refs) — mixed. The 3 `is_read` refs are likely newer code expecting the later shape. |
| Migration needed | **ADD** `is_read BOOLEAN DEFAULT false`, `thread_id UUID`, `parent_id UUID`, `updated_at TIMESTAMPTZ DEFAULT now()`. Keep `read/conversation_id/deleted_by/read_by` — do not drop (12 refs). |

---

## 9. `program_media`

| | |
|---|---|
| Live shape | 7 cols — matches the **later** definition (`20260503000007`): `media_type/url/alt_text/sort_order` |
| First def | `20260503000006` — 11 cols, denormalized: `hero_image/hero_image_alt/video_src/voiceover_src/thumbnail/badge_text/badge_color` |
| Later def | `20260503000007` — 7 cols, normalized |
| App expects | 3 files reference it; no specific column hits |
| **Verdict** | Live = later def (normalized). No migration needed. |
| Migration needed | None. |

---

## 10. `program_ctas`

| | |
|---|---|
| Live shape | 9 cols — matches the **later** definition (`20260503000007`): `cta_type/label/href/style_variant/is_external/sort_order` |
| First def | `20260503000006` — 10 cols, denormalized: `apply_href/enroll_href/request_info_href/career_connect_href/advisor_href/course_href` |
| Later def | `20260503000007` — 9 cols, normalized |
| App expects | 5 files reference it; no specific column hits |
| **Verdict** | Live = later def (normalized). No migration needed. |
| Migration needed | None. |

---

## 11. `program_modules`

| | |
|---|---|
| Live shape | 10 cols — matches the **later** definition (`20260503000007`): `module_number/lesson_count/sort_order` + extra `phase_id` not in either migration |
| First def | `20260213000001` — 10 cols: `order_index/is_published/content` |
| Later def | `20260503000007` — 9 cols: `module_number/lesson_count/sort_order` |
| App expects | `sort_order` (7), `order_index` (3), `module_number` (3), `is_published` (2) |
| **Verdict** | Live = later def shape. App references `order_index` (3) and `is_published` (2) which do not exist in live. Live bugs. |
| Migration needed | **ADD** `order_index INTEGER` (computed from `sort_order` or kept as alias), `is_published BOOLEAN DEFAULT true`. |

---

## 12. `program_certification_pathways`

| | |
|---|---|
| Live shape | 17 cols — matches the **first** definition (`20260326000002`): `certification_body_id UUID/credential_registry_id/credential_name/fee_payer/is_active/sort_order` |
| First def | `20260326000002` — 17 cols, FK-based (`certification_body_id UUID`) |
| Later def | `20260329000001` — 13 cols, text-based (`certification_body TEXT`) — structural downgrade |
| App expects | `fee_payer` (2), `credential_name` (2), `credential_registry_id` (1) |
| **Verdict** | Live = first def. All app-referenced columns exist. Later def's text-based redesign never ran and should not run. |
| Migration needed | None. Later def should be commented out. |

---

## Summary

| Table | Live matches | Migration needed | Risk |
|---|---|---|---|
| `documents` | later def | None | Low |
| `tax_clients` | evolved (neither) | Update 1 app ref (`date_of_birth` → `dob`) | Low |
| `tax_returns` | evolved (neither) | None | Low |
| `wioa_participants` | evolved (neither) | None | Low |
| `wioa_participant_records` | first def | Comment out dangerous later def | Medium |
| `pages` | first def | **ADD** `slug`, `status`, `meta_title`, `meta_desc` | **High** |
| `placement_records` | later def | **ADD** `hire_date`, `employer_id`, `enrollment_id`, `annual_salary`, `verification_source` | **High** |
| `messages` | first def | **ADD** `is_read`, `thread_id`, `parent_id`, `updated_at` | Medium |
| `program_media` | later def | None | Low |
| `program_ctas` | later def | None | Low |
| `program_modules` | later def | **ADD** `order_index`, `is_published` | **High** |
| `program_certification_pathways` | first def | Comment out dangerous later def | Medium |

**3 tables need forward migrations** (live is missing columns app code references):
- `pages` — missing `slug`, `status`
- `placement_records` — missing `hire_date`, `employer_id`, `enrollment_id`, `annual_salary`, `verification_source`
- `program_modules` — missing `order_index`, `is_published`

**2 tables need dangerous later defs commented out**:
- `wioa_participant_records` — later EAV redesign would destroy typed schema
- `program_certification_pathways` — later text-based redesign would downgrade FK structure
