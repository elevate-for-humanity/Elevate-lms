import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { getDecryptedPlatformSecret, refreshSecrets } from '@/lib/secrets';
import { resetProviders } from '@/lib/ai/ai-service';
import { requireAdminClient } from '@/lib/supabase/admin';
import { saveGoogleRuntimeConfiguration } from '@/lib/google/runtime-configuration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Provider = 'xai' | 'anthropic';

const CONFIG: Record<
  Provider,
  { key: string; url: string; headers: (secret: string) => HeadersInit }
> = {
  xai: {
    key: 'XAI_API_KEY',
    url: 'https://api.x.ai/v1/models',
    headers: (secret) => ({ Authorization: `Bearer ${secret}` }),
  },
  anthropic: {
    key: 'ANTHROPIC_API_KEY',
    url: 'https://api.anthropic.com/v1/models?limit=1',
    headers: (secret) => ({ 'x-api-key': secret, 'anthropic-version': '2023-06-01' }),
  },
};

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => null);
    const provider = String(body?.provider || '')
      .trim()
      .toLowerCase() as Provider;
    const config = CONFIG[provider];
    if (!config) return safeError('provider must be xai or anthropic', 400);

    await refreshSecrets();
    const secret = await getDecryptedPlatformSecret(config.key);
    if (!secret) return safeError(`${config.key} is not configured`, 409);

    const response = await fetch(config.url, {
      headers: config.headers(secret),
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: { message?: string };
        message?: string;
      } | null;
      const detail =
        payload?.error?.message || payload?.message || `provider returned ${response.status}`;
      return safeError(
        `${provider === 'xai' ? 'Grok' : 'Anthropic'} rejected the credential: ${detail}`,
        422,
      );
    }

    const synced = await saveGoogleRuntimeConfiguration('admin', [
      { key: config.key, value: secret }, { key: 'AI_PROVIDER', value: provider },
    ]);
    // Persist activation only after the serving Google revision is verified.
    const db = await requireAdminClient();
    const { error: activationError } = await db.rpc('set_platform_secret', {
      p_key: 'AI_PROVIDER',
      p_value: provider,
      p_scope: 'runtime',
    });
    if (activationError) throw activationError;
    await refreshSecrets();
    resetProviders();

    return NextResponse.json({
      success: true,
      provider,
      key: config.key,
      valid: true,
      active: true,
      google: { synchronized: true, revision: synced.revision },
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return safeInternalError(error, 'AI provider validation and synchronization failed');
  }
}
