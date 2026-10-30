import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/require-user';
import { requireAdminClient } from '@/lib/supabase/admin';
import CredentialsClient, { type CredentialWalletItem } from './CredentialsClient';
import { AWARD_DEFINITION, awardBadgeImage } from '@/lib/credentials/award-definition';

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
       ${AWARD_DEFINITION}`
    )
    .eq('learner_id', user.id)
    .order('issued_at', { ascending: false });

  const credentials: CredentialWalletItem[] = error
    ? []
    : (data ?? []).map((row: any) => {
        const definition = Array.isArray(row.credentials) ? row.credentials[0] : row.credentials;
        return {
          id: row.id,
          name: definition?.name ?? 'Credential',
          description: definition?.description ?? '',
          issuer: definition?.issuing_authority ?? 'Credential issuer',
          issuerType: definition?.issuer_type === 'elevate_issued' ? 'elevate_issued' : 'external',
          issuedAt: row.issued_at,
          expiresAt: row.expires_at,
          verificationCode: row.verification_code,
          status: row.status,
          badgeUrl: row.badge_url ?? awardBadgeImage(definition),
          certificateUrl: row.certificate_url,
          openBadgeStatus: row.open_badge_status ?? 'not_issued',
          openBadgeCredentialUrl: row.open_badge_credential_url,
          openBadgeProofType: row.open_badge_proof_type,
        };
      });

  return <CredentialsClient credentials={credentials} />;
}
