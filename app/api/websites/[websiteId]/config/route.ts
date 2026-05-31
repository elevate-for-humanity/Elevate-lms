import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { saveWebsiteConfig } from '@/lib/websites/save-site-config';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { safeError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

type RouteContext = { params: Promise<{ websiteId: string }> };

async function _PATCH(request: NextRequest, context: RouteContext) {
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  const { websiteId } = await context.params;
  const body = await request.json();

  const db = await requireAdminClient();
  const { data: site } = await db
    .from('user_websites')
    .select('id, user_id')
    .eq('id', websiteId)
    .maybeSingle();

  if (!site) return safeError('Website not found', 404);
  if (site.user_id && site.user_id !== auth.id) return safeError('Forbidden', 403);

  const result = await saveWebsiteConfig(websiteId, {
    ...(body.config ?? {}),
    siteName: body.siteName,
  });

  if (!result.ok) return safeError(result.error, 500);
  return NextResponse.json({ ok: true });
}

export const PATCH = withRuntime(withApiAudit('/api/websites/[websiteId]/config', _PATCH));
