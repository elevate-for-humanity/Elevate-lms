import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { getDecryptedPlatformSecret } from '@/lib/secrets';
import { getGoogleRuntimeConfiguration, saveGoogleRuntimeConfiguration, runtimeComponent, GoogleConfigurationError } from '@/lib/google/runtime-configuration';
import policy from '@/config/google-runtime-policy.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'api');
  if (limited) return limited;
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  try {
    const component = runtimeComponent(new URL(req.url).searchParams.get('service') || 'admin');
    const inventory = await getGoogleRuntimeConfiguration(component);
    return NextResponse.json({ ...inventory, provider: 'google-cloud', configured: true,
      services: Object.entries(policy.components).map(([key, value]) => ({ key, id: value.service, label: key })),
      fetchedAt: new Date().toISOString() });
  } catch (error) {
    if (error instanceof GoogleConfigurationError) return safeError(error.message, error.phase === 'validation' ? 400 : 503);
    return safeInternalError(error, 'Failed to inspect Google runtime configuration');
  }
}

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'strict');
  if (limited) return limited;
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json().catch(() => null);
    const key = typeof body?.key === 'string' ? body.key.trim().toUpperCase() : '';
    if (!/^[A-Z][A-Z0-9_]{1,127}$/.test(key)) return safeError('Valid ENV-style key is required', 400);
    const component = runtimeComponent(body?.service || 'admin');
    const value = typeof body?.value === 'string' && body.value.trim()
      ? body.value : await getDecryptedPlatformSecret(key);
    if (!value) return safeError('No runtime value found. Save the credential first.', 400);
    const result = await saveGoogleRuntimeConfiguration(component, [{ key, value }]);
    return NextResponse.json({ ...result, success: true, key, provider: 'google-cloud', updatedServices: [component] });
  } catch (error) {
    if (error instanceof GoogleConfigurationError) return safeError(error.message, error.phase === 'validation' ? 400 : 503);
    return safeInternalError(error, 'Failed to update Google runtime configuration');
  }
}

export async function DELETE(req: NextRequest) {
  const limited = await applyRateLimit(req, 'strict');
  if (limited) return limited;
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  return safeError('Remove Google runtime bindings and secret versions through the audited deployment configuration.', 409);
}
