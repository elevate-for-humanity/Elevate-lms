# IG Security Posture

## What IG Is

IG is a **Licensed Platform Operations Console** - a restricted, role-bound operations environment embedded into enterprise/workforce platform licenses.

**IG is NOT:**

- A general-purpose IDE
- A hosting platform
- A replacement for customer development environments

## Access Tiers

| Role     | Read | Write | Execute | Terminal | Git Push | Audit Logs |
| -------- | ---- | ----- | ------- | -------- | -------- | ---------- |
| Viewer   | ✅   | ❌    | ❌      | ❌       | ❌       | ❌         |
| Operator | ✅   | ✅    | ❌      | ❌       | ❌       | ✅         |
| Engineer | ✅   | ✅    | ✅      | ✅       | ✅       | ✅         |
| Admin    | ✅   | ✅    | ✅      | ✅       | ✅       | ✅         |

## License Tiers

1. **Managed Platform License** - No IG access
2. **Enterprise Operations License** - Operator role max
3. **Restricted Source + Ops License** - Engineer role available

## Security Controls

### Authentication

- [x] All endpoints require valid JWT
- [x] Token validation via Supabase
- [x] Role extracted from token claims

### Authorization

- [x] Role-based permission checks
- [x] License status validation
- [x] Environment scoping (dev/staging/prod)

### Rate Limiting

- [x] Terminal: 100 requests/minute
- [x] Files: 500 requests/minute
- [x] Per-user tracking

### Audit Logging

- [x] All authenticated actions logged
- [x] IP address captured
- [x] 90-day retention in KV
- [x] Queryable audit endpoint (admin only)

### File Security

- [x] Path traversal blocked (`..`, absolute paths)
- [x] Dangerous extensions blocked (.exe, .sh, .php, etc.)
- [x] MIME type validation
- [x] Max file size enforced (100MB)
- [x] Chunked upload for large files

### CORS

- [x] Strict origin allowlist
- [x] No wildcards in production
- [x] Credentials required

### Kill Switch

- [x] License can be deactivated instantly
- [x] Per-user revocation supported
- [x] Revocation logged

## Pre-Deployment Checklist

Before deploying to production:

- [ ] Remove localhost from ALLOWED_ORIGINS
- [ ] Remove Gitpod patterns from ALLOWED_ORIGIN_PATTERNS
- [ ] Verify JWT signature validation is enabled
- [ ] Confirm audit log retention policy
- [ ] Test rate limiting under load
- [ ] Verify kill switch functionality
- [ ] Review all Engineer-tier permissions
- [ ] Confirm license enforcement works

## Incident Response

### Suspected Breach

1. Activate kill switch for affected tenant
2. Export audit logs
3. Revoke all active sessions
4. Investigate access patterns

### License Violation

1. Downgrade role to Viewer
2. Log violation
3. Notify account manager
4. Review for termination

## Compliance Notes

- All terminal commands are logged
- File changes are tracked
- Git operations are audited
- No data leaves without authentication
- Environment isolation prevents cross-tenant access

## Contact

Security issues: security@elevateforhumanity.org
