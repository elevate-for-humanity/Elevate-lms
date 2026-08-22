import { NextResponse } from 'next/server';
import { OPEN_BADGES_CONTEXT, getOpenBadgeIssuerProfile } from '@/lib/credentials/open-badges';

export const dynamic = 'force-dynamic';

const PUBLIC_KEY_MULTIBASE = 'z6Mkv1GgBRPfM9AUTk8ZUhYoTgouk4Zd53RbGJjtE9KQhgQr';

export async function GET() {
  const issuer = getOpenBadgeIssuerProfile();
  const keyId = `${issuer.id}#${PUBLIC_KEY_MULTIBASE}`;
  const publicKey = {
    id: keyId,
    type: 'Multikey',
    controller: issuer.id,
    publicKeyMultibase: PUBLIC_KEY_MULTIBASE,
  };

  return NextResponse.json(
    {
      '@context': [
        OPEN_BADGES_CONTEXT,
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/multikey/v1',
      ],
      ...issuer,
      verificationMethod: [publicKey],
      assertionMethod: [publicKey],
    },
    {
      headers: {
        'Content-Type': 'application/ld+json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    },
  );
}
