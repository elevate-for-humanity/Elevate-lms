import { NextRequest } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { safeError, safeInternalError, safeOk } from '@/lib/api/safe-error';
import { withRuntime } from '@/lib/api/withRuntime';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { runCustomerOperator } from '@/lib/operator/customer-operator';
import { resolveTenantIdForUser } from '@/lib/platform/resolve-tenant-for-user';
import { requireAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/operator/chat
 * Customer-facing AI Operator (not Dev Studio).
 */
async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) {
      return safeError('prompt is required', 400);
    }

    const tenantId = await resolveTenantIdForUser(auth.user.id);
    const db = await requireAdminClient();

    let workspaceId: string | null = body.workspaceId ?? null;
    let organizationId: string | null = null;

    if (tenantId) {
      const { data: org } = await db
        .from('organizations')
        .select('id')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      organizationId = org?.id ?? null;

      if (!workspaceId && organizationId) {
        const { data: ws } = await db
          .from('customer_workspaces')
          .select('id')
          .eq('organization_id', organizationId)
          .maybeSingle();
        workspaceId = ws?.id ?? null;
      }
    }

    const result = await runCustomerOperator({
      prompt,
      userId: auth.user.id,
      workspaceId,
      organizationId,
    });

    return safeOk({
      reply: result.reply,
      action: result.action,
      taskId: result.taskId,
    });
  } catch (err) {
    return safeInternalError(err, 'Operator request failed');
  }
}

export const POST = withRuntime(_POST);
