/** Admin configuration writes go directly to service-scoped Google secrets. */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import {
  GoogleConfigurationError,
  getGoogleRuntimeConfiguration,
  runtimeComponent,
  saveGoogleRuntimeConfiguration,
  validateRuntimeEntries,
} from '@/lib/google/runtime-configuration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

function configurationError(error: unknown) {
  const known = error instanceof GoogleConfigurationError;
  return NextResponse.json({
    error: known
      ? `Google configuration could not be verified (${error.phase}: ${error.code}).`
      : 'Google configuration could not be verified.',
    code: known ? error.code : 'configuration_failed',
    phase: known ? error.phase : 'configuration',
    configurationVerified: false,
    runtimeSynced: false,
  }, { status: known && error.phase === 'validation' ? 400 : 503 });
}

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'strict');
  if (limited) return limited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  try {
    const component = runtimeComponent(req.nextUrl.searchParams.get('component') ?? 'admin');
    return NextResponse.json(await getGoogleRuntimeConfiguration(component));
  } catch (error) { return configurationError(error); }
}

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'strict');
  if (limited) return limited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.entries) || !body.entries.length) return safeError('entries array required', 400);
  if (body.entries.length > 50) return safeError('Maximum 50 entries per request', 400);
  const entries: { key: string; value: string }[] = [];
  for (const raw of body.entries) {
    if (typeof raw?.key !== 'string' || typeof raw?.value !== 'string') return safeError('Each entry must have a string key and value', 400);
    entries.push({ key: raw.key.trim(), value: raw.value });
  }
  try {
    const component = runtimeComponent(body.component ?? 'admin');
    validateRuntimeEntries(component, entries);
    const db = await requireAdminClient();
    const audit = {
      user_id: auth.id, resource_type: 'google_runtime_configuration', resource_id: component,
      metadata: { keys: entries.map(entry => entry.key), count: entries.length, source: 'admin-env-manager', runtime: 'google-cloud' },
    };
    const { error } = await db.from('audit_logs').insert({ ...audit, action: 'env_vars.google_write_requested', created_at: new Date().toISOString() });
    if (error) return safeDbError(error, 'Failed to record configuration request');
    const result = await saveGoogleRuntimeConfiguration(component, entries);
    const completed = await db.from('audit_logs').insert({ ...audit, action: 'env_vars.google_verified',
      metadata: { ...audit.metadata, revision: result.revision, previousRevision: result.previousRevision, versions: result.versions, verifiedAt: result.verifiedAt },
      created_at: new Date().toISOString() });
    if (completed.error) return NextResponse.json({ ...result, error: 'Google configuration is verified, but its application audit record could not be saved.', auditRecorded: false }, { status: 503 });
    return NextResponse.json({ ...result, auditRecorded: true });
  } catch (error) { return configurationError(error); }
}

export async function DELETE(req: NextRequest) {
  const limited = await applyRateLimit(req, 'strict');
  if (limited) return limited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  return safeError('Google secrets must be removed through the governed secret lifecycle.', 409);
}
