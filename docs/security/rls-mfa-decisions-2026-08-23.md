# RLS and MFA decisions — 2026-08-23

## Row-level security

The current no-policy tables remain fail-closed to browser clients. They are service-owned migration, reference, mapping, automation, billing-plan, or telemetry tables: `_migrations`, `apprenticeship_program_aliases`, `apprenticeship_rti_requirements`, `apprenticeship_standard_competencies`, `apprenticeship_standard_versions`, `apprenticeship_wage_milestones`, `automation_followups`, `course_accreditation_metadata`, `course_objectives`, `lesson_competency_map`, `lesson_objectives`, `module_competencies`, `module_objectives`, `plans`, and `platform_usage_events`.

Decision: do not add broad authenticated policies merely to silence the advisor. Server routes must use the service role after authorization. If browser-facing reads are required later, add the narrowest course, tenant, and role policy with a regression test.

## MFA

Decision: privileged `admin`, `super_admin`, and `staff` accounts must enroll TOTP before production administrative work. Recovery codes must be stored outside the application. A second MFA method should be enabled when the Supabase project operationally supports it.

The Supabase “insufficient MFA options” warning remains an implementation item until an additional factor is configured and exercised. It is not recorded as resolved by this decision document.
