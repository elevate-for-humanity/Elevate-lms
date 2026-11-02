# Admin and Supabase reconciliation — November 2, 2026

This audit compares literal database selections, filters, and ordering in `apps/admin`, `components/admin`, and `lib/admin` with the connected production project's public schema. It does not claim to execute every dynamic query, every nested relationship, or every role dashboard.

The initial scan found 44 invalid column references. After repairs, the same scan examined 5,196 literal query references across 468 tables and views and found zero missing table/column references. Changed repository files were also compared side by side with their starting revision.

| Repository behavior before | Verified database contract | Repair |
|---|---|---|
| Completion export selects a missing verification URL and labels every record WIOA/WRG | Certificates have no verification URL; partner enrollments store funding_source | Remove phantom field and use saved funding source; return 503 for failed reads |
| Enrollment export reads funding_type and renders an unselected status | program_enrollments uses funding_source and enrollment_state | Read, filter and export canonical fields |
| Employer CSV import filters and writes a missing tenant_id | Employers have owner_user_id | Scope lookup and creation to the authorized owner's identity; use saved city/state/ZIP fields |
| SSO configuration writes into user identity connections | Provider settings belong to sso_providers | Use provider records and exclude client secrets from returned selections |
| CRM templates deliberately query nonexistent active/category columns before retrying | Template lifecycle is status, body is content | Query the live contract directly and surface outages |
| Stuck-approval job selects an absent partner relation and review date | Applications record approved_at | Remove phantom relation and use actual approval timestamp |
| Five instructor surfaces filter a nonexistent course instructor_id | Ownership is instructor_assignments, active=true | Load assigned course IDs, then read those courses; preserve failure states |
| Credential page expects credential_id on courses | course_credentials links credentials and courses | Resolve through actual link records |
| QA checklist pages query absent active/assignee/frequency fields and have an inactive button | Saved name, items, and category; completion API persists per-user records | Map saved fields and require a confirmed completion record before refreshing |
| Staff training/modules order by absent order_index | training_modules records have created_at and module_id | Use saved order and identity fields |
| Application queue sorts on an absent priority | Queue view exposes created_at | Use actual submission chronology |
| Contract templates and reviews sort by absent fields | created_at / review_period_end | Use saved chronology |
| Funding resolution filters a nonexistent enrollment_id | Flags use entity_type=program_enrollment and entity_id | Resolve the exact enrollment's flags |
| Host Shop finance reads nonexistent document created_at | Partner uploads record uploaded_at | Read/order by actual upload timestamp |
| Impersonation history reads the wrong audit stream and action | Session writer uses audit_logs with impersonation_started | Read the writer's actual stream and metadata |
| Incentives invent a student/hour-progress contract | Saved incentive records have name, type, description, amount and employer | Show saved incentive fields; remove manufactured progress |
| JRI listing selects absent program/employment fields and a phantom profile join | Current table records id, status, created_at | Show only persisted identity/status/date; propagate query failures |
| Program external courses sort by absent order_index | External items use sort_order; internal links retain order_index | Keep each relation's actual ordering contract |
| RAPIDS progress uses an absent submitted_at | Progress records expose submitted_to_rapids | Count actual submission state |
| Attendance queries use a nonexistent date | Attendance records expose check_in_time | Read the actual daily check-in range |
| Tenant risk query filters an absent tenant_id | Profiles carry tenant ownership; risk rows carry user_id | Resolve tenant user IDs first and constrain risk reads to those users |
| Binder uses disconnected legacy student/document/enrollment tables and inactive actions | Profiles, documents and program_enrollments own current records | Use canonical records, saved program requirements, real review/upload links, and explicit data errors |
| Upload reports success even if dashboard insert fails, and invents a public private-bucket URL | A usable upload needs storage and a saved document row | Validate owner, persist storage locator, roll back a new orphan on insert failure, return the authorized review route |
| Repeated geofence attempts create duplicate operational alerts | Original events retain the complete evidence | Partial unique index prevents duplicate open entry/action alerts; genuine events remain preserved |
| Missing-lunch detection ignores a recorded manual break duration | progress_entries.break_minutes is persisted evidence | Respect a positive recorded break duration without inventing clock punches |

## Production record changes

- Confirmed 27 pending non-QA files physically exist in storage.
- Repaired storage/enrollment links for four learner files and approved those four through the transactional review function.
- Approved fourteen Program Holder files and accepted eight Host Shop files at the owner's explicit request, recording audit evidence.
- Corrected an EIN upload's category instead of treating it as a business license.
- Kept `DEMO_VIDEO_SLIDES.pdf` pending: it does not establish the EIN requirement.
- Resolved eight corrected or duplicate geofence alerts with reasons and retained original records.
- Installed and verified `admin_alerts_open_geofence_entry_action_uidx`; a duplicate insert was rejected without creating a test alert.
- Found no positive submitted hours awaiting approval. Three disputed entries are superseded by earlier reconciliations and must not be credited twice.
- Email reconciliation confirms Logan's October 12 and October 20 hours are already approved. Historical schedules require net reconciliation against existing credits, not duplicate day inserts.

## Training evidence

All five registered digital workbooks are active. Their PDFs exist in storage and every saved section contains prompts. Barber, cosmetology, and business courses used by current direct course enrollments are published. The active HVAC course has 21 published lessons, including 17 saved videos, plus 96 unpublished build rows. Bookkeeping, esthetics, nail, and other incomplete builds are not certified complete merely by changing publication flags.

## Remaining acceptance work

Twenty-seven operational alerts remain: 21 missing-lunch, four location, one WRG correction, and one voucher reconciliation. These still require evidence or the underlying financial/attendance correction. No unverified funding receipt, meal break, credential, or training hour was invented.

Targeted regression tests and changed-file lint pass. Full dependency-complete TypeScript/build checks, mobile browser acceptance across every dashboard, external feed readiness, and exact production revision acceptance remain separate release requirements; a successful source commit or a passing health probe is not deployment completion.
