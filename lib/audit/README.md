# Audit System

The audit subsystem has two canonical write paths, separated by responsibility:

| File | Canonical use | DB table |
|------|---------------|----------|
| `withApiAudit.ts` | API-route audit wrapping | `admin_audit_events` |
| `../admin/audit-log.ts` | Admin mutations (role changes, approvals, bulk operations) | `admin_audit_events` |
| `../logging/auditLog.ts` | General application/security/compliance events | `audit_logs` |
| `transactional.ts` | Events that must commit with the same database transaction | `audit_logs` |
| `ferpa.ts` | FERPA-specific PII access events | `audit_logs` |
| `api-audit.ts` | Low-level writer used by `withApiAudit`; do not call directly | `admin_audit_events` |

`audit_logs` canonical application columns are `user_id`, `tenant_id`, `role`, `action`, `resource_type`, `resource_id`, `details`, `ip_address`, `user_agent`, and `success`. Older audit columns remain database compatibility fields and should not receive new application writes.

## Canonical patterns

**API route:**
```ts
import { withApiAudit } from '@/lib/audit/withApiAudit';
async function _POST(req: Request) { ... }
export const POST = withApiAudit('/api/my-route', _POST);
```

**Admin server action:**
```ts
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
await logAdminAudit({ action: AdminAction.ROLE_CHANGED, actorId, entityType: 'profiles', entityId, req });
```

**General app event:**
```ts
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
await auditLog({ actorId: userId, action: AuditAction.DOCUMENT_UPLOADED, entity: AuditEntity.DOCUMENT, entityId: docId });
```

## Compatibility adapters

- `logAction.ts` — retained only for the current case-manager safeguard callers. It no longer writes `audit_logs` directly; it delegates to `../logging/auditLog.ts`. Remove it after those callers migrate to the canonical writer.
- `../auditLog.ts` — older broad audit API with query helpers. Do not add new consumers. Migrate existing consumers incrementally before removal.

Do not create additional direct `audit_logs` writers. Specialized code should call the canonical general writer unless transaction atomicity or a dedicated compliance boundary requires otherwise.

## Deleted (do not re-create)

- `lib/audit-logger.ts` — zero importers, superseded by `withApiAudit`
- `lib/audit/audit-logger.ts` — duplicate of above
- `lib/audit/auditLogger.ts` — duplicate of above
- `lib/audit/logger.ts` — duplicate of above
