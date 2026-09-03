# AI Capability Boundaries

## Trust model

Every layer is treated as potentially hostile:
- Human layer: compromised sessions possible
- AI layer: prompt injection possible  
- API layer: malformed payloads possible
- DB layer: overprivileged queries possible

AI never has god-mode access. It calls scoped capability functions.

## Capability domains

| Domain | Tools | Tables accessible | Can mutate? |
|---|---|---|---|
| CRM | `getLeads`, `getApplications`, `updateApplicationStatus` | applications, leads, profiles (read) | status only |
| Compliance | `getComplianceAlerts`, `getComplianceItems` | compliance_items, compliance_alerts | none |
| Reporting | `getEnrollmentStats`, `getFundingSummary`, `getProgramMetrics` | program_enrollments, programs, ita_vouchers | none |
| Curriculum | `getPrograms`, `getCourses`, `getLessons` | programs, courses, curriculum_lessons | none |
| Operations | `getAtRiskLearners`, `getStaleApplications` | at_risk_learners (view), applications | none |

## Prohibited AI actions

- ❌ Direct table queries with service-role key (`query_database` tool — removed)
- ❌ Role escalation to `super_admin`
- ❌ Triggering deployments autonomously
- ❌ Sending bulk communications without confirmation
- ❌ Modifying funding records
- ❌ Accessing `profiles`, `wioa_cases`, `payment_records`, `documents`, `stripe_*`, `tax_*`

## Confirmation enforcement

Actions marked `requires_confirmation: true` in `lib/platform/system-registry.ts` **halt**
and return `CONFIRMATION_REQUIRED` unless `args.confirmed === true` is explicitly set.
This is enforced server-side in `executeAction()` — never AI-decided.

## Audit logging

Every AI assistant query is logged to `ai_audit_log`:
- `user_id` — who asked
- `action` — what was called
- `details.prompt` — first 500 chars of input
- `details.reply` — first 500 chars of output
- `ip_address` — request origin

Logs are non-fatal (fire-and-forget) but failures are logged via `logger.error`.

## Prompt injection protection

Client-supplied `history` arrays are sanitized before passing to the model:
- Only `user` and `assistant` roles are accepted
- `system`, `tool`, `function`, `developer` roles are stripped
- History is capped at 8 turns
