import { NextRequest } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { safeError, safeInternalError, safeOk } from '@/lib/api/safe-error';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/subscriptions/cancel
 * Marks organization subscription canceled (Stripe cancel-at-period-end is phase 2).
 */
async function _POST(request: NextRequest) {
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const { data: profile } = await db
      .from('profiles')
      .select('tenant_id')
      .eq('id', auth.id)
      .maybeSingle();

    const tenantId = profile?.tenant_id as string | null;
    if (!tenantId) {
      return safeError('No organization subscription found', 404);
    }

    const { error } = await db
      .from('organization_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('organization_id', tenantId);

    if (error) {
      return safeError('Subscription record not found or could not be updated', 404);
    }

    return safeOk({ canceled: true });
  } catch (err) {
    return safeInternalError(err, 'Failed to cancel subscription');
  }
}

export const POST = withRuntime(_POST);
