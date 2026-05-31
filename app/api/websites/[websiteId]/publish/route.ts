import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { safeError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';
import { publishWebsite } from '@/lib/websites/publish-website';

type RouteContext = { params: Promise<{ websiteId: string }> };

async function _POST(request: NextRequest, context: RouteContext) {
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  const { websiteId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const requestedSubdomain =
    typeof body.subdomain === 'string' ? body.subdomain.trim().toLowerCase() : '';

  const db = await requireAdminClient();
  const { data: site } = await db
    .from('user_websites')
    .select('id, user_id, organization_id, subdomain')
    .eq('id', websiteId)
    .maybeSingle();

  if (!site) return safeError('Website not found', 404);
  if (site.user_id && site.user_id !== auth.id) return safeError('Forbidden', 403);

  let subdomain = requestedSubdomain || (site.subdomain as string | null);
  if (!subdomain && site.organization_id) {
    const { data: org } = await db
      .from('organizations')
      .select('slug')
      .eq('id', site.organization_id)
      .maybeSingle();
    subdomain = org?.slug ?? undefined;
  }

  if (!subdomain) return safeError('Subdomain is required to publish', 400);

  const result = await publishWebsite(websiteId, subdomain);
  if (!result.ok) {
    const status = result.error.includes('in use') ? 409 : 500;
    return safeError(result.error, status);
  }

  return NextResponse.json({ ok: true, subdomain, publicUrl: result.publicUrl });
}

export const POST = withRuntime(withApiAudit('/api/websites/[websiteId]/publish', _POST));
