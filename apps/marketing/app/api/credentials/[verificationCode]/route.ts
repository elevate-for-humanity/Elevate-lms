import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getOpenBadgeStatus } from '@/lib/credentials/open-badges';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
       credentials!inner(id, name, description, is_active, is_published)`,
    )
    .eq('verification_code', verificationCode)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
  }

  const definition = Array.isArray(data.credentials)
    ? data.credentials[0]
    : data.credentials;

  if (!definition?.is_active || !definition?.is_published) {
    return NextResponse.json({ error: 'Credential not available' }, { status: 404 });
  }

  const status = getOpenBadgeStatus({
    status: data.status,
    expiresAt: data.expires_at,
    revokedAt: data.revoked_at,
  });

  if (!data.open_badge_credential) {
    return NextResponse.json(
      {
        verificationCode: data.verification_code,
        credential: definition.name,
        description: definition.description,
        status,
        badgeUrl: data.badge_url,
        openBadgeStatus: data.open_badge_status,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300',
        },
      },
    );
  }

  return NextResponse.json(
    {
      ...data.open_badge_credential,
      _verification: {
        status,
        verificationCode: data.verification_code,
      },
    },
    {
      headers: {
        'Content-Type': 'application/ld+json; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    },
  );
}
