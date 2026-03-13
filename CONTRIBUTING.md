# Contributing to Elevate for Humanity — Workforce Operating System

This is a managed enterprise platform operated by 2Exclusive LLC-S d/b/a Elevate for Humanity Career & Training Institute. This repository is public for transparency and evaluation purposes.

## Who Can Contribute

Direct contributions to this repository are limited to:

- **Core team** — Elevate for Humanity staff and authorized contractors
- **Enterprise source-use licensees** — organizations with an active enterprise source-use agreement
- **Invited collaborators** — individuals explicitly granted access by the platform owner

If you are not in one of these categories, the appropriate path is to file an issue describing the problem or improvement. The core team will evaluate and implement changes.

## For Core Team and Authorized Contributors

### Before You Start

1. Check open issues and in-progress work to avoid duplication.
2. For any change touching enrollment, funding, compliance, or student data — discuss with the platform owner before writing code.
3. For security-sensitive changes (auth, RLS, payments, audit logging) — require explicit sign-off before merging.

### Branch and Commit Standards

- All work lands on `main`. No long-lived feature branches.
- Commit messages: `type: short description` — e.g., `fix: enrollment status not updating after payment`
- Keep commits focused. One logical change per commit.
- Run `pnpm build` and `pnpm lint` before pushing. Zero errors required.

### Pull Request Requirements

Use the PR template in `.github/PULL_REQUEST_TEMPLATE.md`. Every checkbox must be addressed before merge. Key requirements:

- **Auth** — server-side enforcement in place; no client-only security
- **Compliance** — changes to enrollment, funding, or reporting workflows reviewed for WIOA/DOL alignment
- **Data handling** — no PII in logs; RLS policies verified; multi-tenant boundaries preserved
- **Build** — `pnpm build` passes with zero errors
- **Evidence** — proof of testing provided (logs, screenshots, or test output)

### What Not to Touch Without Explicit Authorization

- `/supabase/migrations/` — schema changes require owner review and coordinated deployment
- `/lib/licensing/` — licensing and provisioning logic
- `/app/api/webhooks/` — payment and external webhook handlers
- `/netlify/functions/` — serverless functions
- `CODEOWNERS`, `SECURITY.md`, `.env.example`

### Code Style

- TypeScript throughout. No `any` without justification.
- Match existing patterns in the file you are editing.
- Brand colors: use `brand-blue-*`, `brand-red-*`, `brand-orange-*`, `brand-green-*` — not raw Tailwind `blue-*`.
- No `console.log` in production paths — use the `logger` utility.

## Reporting Issues

Anyone can file issues using the templates in `.github/ISSUE_TEMPLATE/`:

- **Bug Report** — defects in the platform
- **Feature Request** — new capabilities or improvements
- **Compliance / Data Concern** — data handling, FERPA, WIOA, or regulatory issues

For security vulnerabilities, do not file a public issue. See [docs/SECURITY.md](docs/SECURITY.md).

## Questions

Contact: info@elevateforhumanity.org
