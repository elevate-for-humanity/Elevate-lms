# Stripe Configuration Guide

## Required Secrets

The following Stripe secrets need to be configured **manually in Northflank dashboard** or **GitHub Actions secrets**:

### Northflank Environment Variables

For each service (elevate-lms, elevate-admin, elevate-lms-build), add these secrets:

| Secret Name | Purpose |
|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (whsec_...) |

### GitHub Actions Secrets

| Secret Name | Purpose |
|-------------|---------|
| `STRIPE_SECRET_KEY` | For CI/CD integrity gate |
| `STRIPE_WEBHOOK_SECRET` | For CI/CD integrity gate |

## Where to Add

### 1. Northflank Dashboard
1. Go to Northflank → Project → Service → Configuration
2. Add each secret as an environment variable (mark as secret)
3. Rebuild the service after adding

### 2. GitHub Actions Secrets
1. Go to GitHub → Repository → Settings → Secrets and variables → Actions
2. Add `STRIPE_WEBHOOK_SECRET`
3. This will fix the Integrity Gate failure

## Verification

After adding the webhook secret, the Integrity Gate should pass:

```
OK: Stripe Secret Key configured
OK: Stripe Webhook Secret configured
```

## Notes

- Never commit Stripe keys to the repository
- Use Northflank's secret management for runtime secrets
- Use GitHub Actions secrets for CI/CD validation
