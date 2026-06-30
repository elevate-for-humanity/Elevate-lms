import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getOrganizationFeatures } from '@/lib/platform/organization-features';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { safeError } from '@/lib/api/safe-error';

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.tenant_id) {
    return NextResponse.json({ organizationId: null, entitlements: null });
  }

  const admin = await requireAdminClient();
  if (!admin) return safeError('Service unavailable', 503);

  const entitlements = await getOrganizationFeatures(profile.tenant_id, admin);
  return NextResponse.json({ organizationId: profile.tenant_id, entitlements });
}

export const GET = withApiAudit('/api/account/subscription', _GET);
