# Security Policy

## Reporting a Vulnerability

**Do not file a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in this platform, report it privately:

**Email:** info@elevateforhumanity.org
**Subject:** `Security Vulnerability Report`

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested remediation

We will acknowledge receipt within 2 business days and provide a resolution timeline within 5 business days.

## Scope

This policy covers the Elevate for Humanity Workforce Operating System, including:

- [elevateforhumanity.org](https://www.elevateforhumanity.org) and all subpaths
- API endpoints under `/api/`
- Authentication and enrollment flows
- Admin, student, employer, and program holder portals

## Out of Scope

- Third-party services (Supabase, Stripe, Netlify, Resend, OpenAI) — report those directly to the respective vendor
- Social engineering or phishing attacks
- Denial of service

## Security Architecture

| Layer | Implementation |
|-------|---------------|
| **Authentication** | Supabase Auth — JWT tokens, server-side validation on every request |
| **Authorization** | Row Level Security (RLS) on all database tables; role-based access control |
| **Transport** | HTTPS enforced via Netlify; HSTS enabled |
| **Payments** | Stripe — no card data stored; PCI DSS handled by Stripe |
| **Secrets** | Environment variables only; never committed to source |
| **Audit logging** | All critical actions logged with actor, timestamp, and context |
| **Input validation** | Zod schemas on all API routes |
| **Multi-tenancy** | Tenant isolation enforced at database and API layers |

## Data Classification

| Data Type | Classification | Handling |
|-----------|---------------|---------|
| Student PII (name, DOB, SSN last 4) | Restricted | Encrypted at rest; RLS-protected; FERPA-aligned |
| Enrollment and funding records | Restricted | Audit-logged; agency-reportable |
| Payment data | Restricted | Stripe-managed; not stored locally |
| Course content and credentials | Internal | RLS-protected |
| Public program information | Public | No restrictions |

## Integrity Controls

Two merge-blocking CI scanners enforce structural invariants on every PR. Neither requires secrets. Both run in `integrity-gate.yml` before build.

### Pre-auth registry (`scripts/check-pre-auth-registry.cjs`)

**Invariant:** Any route that inserts into a table before the user is authenticated must declare that table in `lib/pre-auth-tables.ts`.

**What it catches:** Public form routes (enrollment, application, barbershop) that write rows without a `user_id`. Those rows must be reconcilable after signup — the registry drives `reconcilePreAuthRows()` in both auth callback paths.

**Exemption:** `// pre-auth-registry: exempt — <reason>` in the route file. Use only for routes that are always called with a verified `userId` (e.g. Stripe webhook handlers).

**Extending:** Add the table to `PRE_AUTH_TABLES` in `lib/pre-auth-tables.ts`. CI enforces immediately.

---

### Grants audit context (`scripts/check-grants-audit-context.cjs`)

**Invariant:** Any function that writes to a registered auditable grants table must call `setAuditContext(db, { systemActor: '...' })` before the write.

**What it catches:** Missing audit attribution on grants system writes — submissions, eligibility checks, package builds, federal form generation, notifications. These tables are compliance-relevant; writes without actor context produce unattributable audit records.

**Registered tables:**

| Table | Written by |
|-------|-----------|
| `grant_submissions` | `grants_submission_tracker` |
| `grant_federal_forms` | `grants_federal_forms` |
| `grant_packages` | `grants_package_builder` |
| `entity_eligibility_checks` | `grants_eligibility_engine` |
| `grant_eligibility_results` | `grants_eligibility_engine` |
| `grant_notifications` | `grants_notification_system` |
| `grant_notification_log` | `grants_notification_system` |

**Exemption:** `// grants-audit: exempt — <reason>` inside the function body. Use only for user-initiated writes where system actor attribution would be misleading (e.g. mark-read toggles).

**Extending:** Add the table to `AUDITABLE_TABLES` in the scanner script. CI enforces immediately on all existing and future write functions.

**Detection layers:** The scanner uses three layers:
- **Layer 1 (direct):** Statement-boundary scanning — walks to semicolon or depth-0 close, covering arbitrarily long chained queries.
- **Layer 2 (intermediate variables):** Tracks variables assigned from `.from(auditable_table)` and flags write ops on those variables anywhere in the function body.
- **Layer 3 (single-level local helper indirection):** Builds a per-file function map and flags callers whose same-file callees write to auditable tables without audit context.

**Coverage statement:** Within the scanner's intended scope, there are no known detection gaps for direct writes, intermediate variables, single-level local helper indirection, or long chained statements. Remaining out-of-scope cases are multi-file indirection and dynamic dispatch — neither pattern exists in the grants codebase as of commit `88a4d07`, and both would require deliberate architectural choices to introduce.

**Actor naming convention:** `grants_<module>` — e.g. `grants_submission_tracker`, `grants_eligibility_engine`. Keep actor strings consistent; they appear verbatim in audit records.

---

## Responsible Disclosure

We ask that you:

- Give us reasonable time to investigate and remediate before public disclosure
- Avoid accessing, modifying, or deleting data that is not yours
- Do not disrupt platform availability or degrade service for other users

We will not pursue legal action against researchers who follow this policy in good faith.
