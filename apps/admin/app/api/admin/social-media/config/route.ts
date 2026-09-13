import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getDecryptedPlatformSecret } from '@/lib/secrets';
import { getMetaOAuthConfig } from '@/lib/social/meta-oauth-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  const metaConfig = await getMetaOAuthConfig();
  const field = async (resolved: { key: string | null; value: string }) => {
    const canonicalValue = resolved.key ? (await getDecryptedPlatformSecret(resolved.key))?.trim() || '' : '';
    return {
      configured: Boolean(resolved.value),
      canonicalConfigured: Boolean(canonicalValue),
      runtimeMatchesCanonical: Boolean(resolved.value && canonicalValue && resolved.value === canonicalValue),
      source: resolved.key,
    };
  };

  const [clientId, clientSecret, pageId] = await Promise.all([
    field(metaConfig.clientId),
    field(metaConfig.clientSecret),
    field(metaConfig.pageId),
  ]);
  const origin = adminOrigin(request);
  // Meta can discover the authorized page during OAuth. A configured page ID
  // is only required when the user manages more than one eligible page.
  const ready = clientId.configured && clientSecret.configured;

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
