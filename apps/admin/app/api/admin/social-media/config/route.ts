import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const META_KEYS = ['FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET', 'FACEBOOK_PAGE_ID'] as const;

function adminOrigin(request: NextRequest) {
  const configured = process.env.ADMIN_APP_URL?.trim() || process.env.NEXT_PUBLIC_ADMIN_URL?.trim();
  if (configured) return new URL(configured).origin;
  return process.env.NODE_ENV === 'production' ? 'https://admin.elevateforhumanity.org' : request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  await hydrateProcessEnv();
  const db = await requireAdminClient();
  const { data } = await db
    .from('platform_secrets')
    .select('key,value_enc')
    .in('key', [...META_KEYS]);
  const canonical = new Map((data ?? []).map((row) => [row.key, row.value_enc?.trim() || '']));

  const field = (key: typeof META_KEYS[number]) => {
    const runtimeValue = process.env[key]?.trim() || '';
    const canonicalValue = canonical.get(key) || '';
    return {
      configured: Boolean(runtimeValue),
      canonicalConfigured: Boolean(canonicalValue),
      runtimeMatchesCanonical: Boolean(runtimeValue && canonicalValue && runtimeValue === canonicalValue),
    };
  };

  const clientId = field('FACEBOOK_CLIENT_ID');
  const clientSecret = field('FACEBOOK_CLIENT_SECRET');
  const pageId = field('FACEBOOK_PAGE_ID');
  const origin = adminOrigin(request);
  const ready = clientId.configured && clientSecret.configured && pageId.configured;

  return NextResponse.json({
    provider: 'meta',
    service: 'admin',
    ready,
    clientId,
    clientSecret,
    pageId,
    callbackUrl: `${origin}/api/auth/facebook/callback`,
    graphVersion: process.env.META_GRAPH_API_VERSION?.trim() || 'v26.0',
    checkedAt: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
