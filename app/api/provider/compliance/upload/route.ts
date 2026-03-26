
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { providerApiGuard } from '@/lib/api/provider-guard';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const guard = await providerApiGuard();
  if (guard.error) return guard.error;
  const { userId: uid, tenantId } = guard;

  const supabase = await createClient();

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return safeError('Invalid request body', 400); }

  const { artifactType, label, issuer, issuedAt, expiresAt, externalUrl } = body as Record<string, string | null>;

  if (!artifactType || !label) return safeError('artifactType and label are required', 400);

  const validTypes = ['mou', 'insurance', 'w9', 'state_license', 'etpl_approval', 'accreditation', 'other'];
  if (!validTypes.includes(artifactType)) return safeError('Invalid artifact type', 400);

  const { data, error } = await supabase
    .from('provider_compliance_artifacts')
    .insert({
      tenant_id: tenantId,
      artifact_type: artifactType,
      label,
      issuer: issuer ?? null,
      issued_at: issuedAt ?? null,
      expires_at: expiresAt ?? null,
      external_url: externalUrl ?? null,
      uploaded_by: uid,
      verified: false,
    })
    .select('id')
    .single();

  if (error) return safeInternalError(error, 'Failed to save document');

  return NextResponse.json({ success: true, artifactId: data.id }, { status: 201 });
}
