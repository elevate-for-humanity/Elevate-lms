import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getOpenBadgeStatus } from '@/lib/credentials/open-badges';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hasCryptographicProof(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const credential = value as { proof?: unknown };
  if (Array.isArray(credential.proof)) return credential.proof.length > 0;
  return !!credential.proof && typeof credential.proof === 'object';
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ verificationCode: string }> },
) {
  const { verificationCode } = await params;
  const db = await requireAdminClient();

  const { data, error } = await db
    .from('learner_credentials')
    .select(
      `id, verification_code, status, expires_at, revoked_at, open_badge_credential,
       open_badge_credential_url, open_badge_status, badge_url,
       credentials!inner(id, name, description)`,
    )
    .eq('verification_code', verificationCode)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
  }

  const definition = Array.isArray(data.credentials) ? data.credentials[0] : data.credentials;
  if (!definition) {
    return NextResponse.json({ error: 'Credential definition not found' }, { status: 404 });
  }

  const status = getOpenBadgeStatus({
    status: data.status,
    expiresAt: data.expires_at,
    revokedAt: data.revoked_at,
  });

  const signedBadgeReady =
    data.open_badge_status === 'issued' && hasCryptographicProof(data.open_badge_credential);

  if (!signedBadgeReady) {
    return NextResponse.json(
      {
        verificationCode: data.verification_code,
        credential: definition.name,
        description: definition.description,
        status,
        badgeUrl: data.badge_url,
        openBadgeStatus: data.open_badge_status,
        verifiableCredentialAvailable: false,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300',
        },
      },
    );
  }

  // Return only the signed credential. Issuer certification uses JSON-LD safe
  // mode and rejects undefined custom terms added to the credential document.
  return NextResponse.json(data.open_badge_credential, {
    headers: {
      'Content-Type': 'application/ld+json; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  });
}
