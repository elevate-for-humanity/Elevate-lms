# Admin Security & Secrets Runbook

## Storage policy
- Secrets are stored only in environment/secret manager.
- Never commit secrets to git.
- Never paste secrets into tickets/chat.

## Rotation cadence
- High-risk keys (service role, auth/session, API providers): every 30–60 days.
- Immediate rotation after any suspected exposure.

## Rotation procedure
1. Create new key in provider dashboard.
2. Update hosting/admin secret store.
3. Redeploy service.
4. Validate using health checks and critical flows.
5. Revoke old key.

## Minimum secret inventory
- Supabase URL/anon/service role
- Auth/session secrets
- AI provider keys
- Storage credentials (R2)
- Email provider API key
- Cron secret

## Verification commands
```bash
node scripts/check-required-env-smoke.mjs
pnpm -s audit:admin
pnpm -s route:audit
pnpm -s check:redirects
pnpm -s integrity:links
```

## Incident response
- Rotate exposed secret immediately.
- Invalidate related sessions/tokens where applicable.
- Document impact window.
- Re-run full acceptance checks.
