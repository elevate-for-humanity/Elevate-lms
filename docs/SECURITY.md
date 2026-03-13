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

## Responsible Disclosure

We ask that you:

- Give us reasonable time to investigate and remediate before public disclosure
- Avoid accessing, modifying, or deleting data that is not yours
- Do not disrupt platform availability or degrade service for other users

We will not pursue legal action against researchers who follow this policy in good faith.
