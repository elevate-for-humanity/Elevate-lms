import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/require-user';
import { requireAdminClient } from '@/lib/supabase/admin';
import CredentialsClient, { type CredentialWalletItem } from './CredentialsClient';

export const metadata: Metadata = {
  title: 'My Credentials | Elevate for Humanity',
  description: 'View, verify, and share your earned credentials and digital badges.',
};

export const dynamic = 'force-dynamic';

export default async function CredentialsPage() {
  const user = await requireUser();
  const db = await requireAdminClient();

  const { data, error } = await db
    .from('learner_credentials')
    .select(
      `id, verification_code, status, issued_at, expires_at, badge_url, certificate_url,
       open_badge_status, open_badge_credential_url, open_badge_proof_type,
       credentials(name, description, issuing_authority, partner_id, badge_image_url)`
    )
    .eq('learner_id', user.id)
    .order('issued_at', { ascending: false });

  const partnerIds = Array.from(
    new Set(
      (data ?? [])
        .map((row: any) => {
          const definition = Array.isArray(row.credentials) ? row.credentials[0] : row.credentials;
          return definition?.partner_id as string | undefined;
        })
        .filter(Boolean),
    ),
  ) as string[];

  const partnerById = new Map<string, { name: string; type: string }>();
  if (partnerIds.length) {
    const { data: partners } = await db
      .from('credentialing_partners')
      .select('id, name, type')
      .in('id', partnerIds);
    for (const partner of partners ?? []) {
      partnerById.set(partner.id, { name: partner.name, type: partner.type });
    }
  }

  const credentials: CredentialWalletItem[] = error
    ? []
    : (data ?? []).map((row: any) => {
        const definition = Array.isArray(row.credentials) ? row.credentials[0] : row.credentials;
        const partner = definition?.partner_id ? partnerById.get(definition.partner_id) : undefined;
        return {
          id: row.id,
          name: definition?.name ?? 'Credential',
          description: definition?.description ?? '',
          issuer: definition?.issuing_authority ?? partner?.name ?? 'Credential issuer',
          issuerType: partner?.type === 'internal' ? 'elevate_issued' : 'external',
          issuedAt: row.issued_at,
          expiresAt: row.expires_at,
          verificationCode: row.verification_code,
          status: row.status,
          badgeUrl: row.badge_url ?? definition?.badge_image_url ?? null,
          certificateUrl: row.certificate_url,
          openBadgeStatus: row.open_badge_status ?? 'not_issued',
          openBadgeCredentialUrl: row.open_badge_credential_url,
          openBadgeProofType: row.open_badge_proof_type,
        };
      });

  return <CredentialsClient credentials={credentials} />;
}
