import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import {
  buildOpenBadgeCredential,
  hashRecipientIdentifier,
  type OpenBadgeCredential,
  validateOpenBadgeStructure,
} from '@/lib/credentials/open-badges';

const ALLOWED_PROOF_TYPES = new Set(['DataIntegrityProof']);
const ALLOWED_CRYPTOSUITES = new Set(['eddsa-rdfc-2022', 'ecdsa-sd-2023']);

export type NativeIssueResult =
  | { success: true; status: 'issued'; credential: OpenBadgeCredential; url: string }
  | { success: true; status: 'pending_signature'; credential: OpenBadgeCredential; url: string }
  | { success: false; error: string };

function credentialUrl(verificationCode: string): string {
  const base = (
    process.env.OPEN_BADGES_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.elevateforhumanity.org'
  ).replace(/\/$/, '');
  return `${base}/api/credentials/${encodeURIComponent(verificationCode)}`;
}

async function signCredential(
  credential: OpenBadgeCredential,
): Promise<OpenBadgeCredential | null> {
  const signingUrl = process.env.OPEN_BADGES_SIGNING_SERVICE_URL;
  if (!signingUrl) return null;

  const response = await fetch(signingUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.OPEN_BADGES_SIGNING_SERVICE_TOKEN
        ? { Authorization: `Bearer ${process.env.OPEN_BADGES_SIGNING_SERVICE_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({ credential }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Open Badges signing service returned ${response.status}`);
  }

  const signed = (await response.json()) as OpenBadgeCredential;
  const proof = signed.proof as Record<string, unknown> | undefined;
  const proofType = String(proof?.type ?? '');
  const cryptosuite = String(proof?.cryptosuite ?? '');

  if (!ALLOWED_PROOF_TYPES.has(proofType) || !ALLOWED_CRYPTOSUITES.has(cryptosuite)) {
    throw new Error('Signing service returned a proof outside the approved Open Badges 3.0 cryptosuites');
  }

  return signed;
}

/**
 * Issues an Elevate-owned Open Badge from the canonical learner_credentials row.
 * Partner-delivered/proctored credentials remain external and are never re-issued
 * as if Elevate were the certifying authority.
 */
export async function issueNativeOpenBadge(
  learnerCredentialId: string,
): Promise<NativeIssueResult> {
  const db = await requireAdminClient();

  const { data: award, error } = await db
    .from('learner_credentials')
    .select(
      `id, learner_id, credential_id, verification_code, issued_at, expires_at, status,
       open_badge_status, open_badge_credential,
       credentials!inner(id, name, description, issuer_type, issuing_authority,
         open_badges_enabled, achievement_type, achievement_criteria_narrative,
         achievement_criteria_url, badge_image_url, alignment, is_active, is_published)`
    )
    .eq('id', learnerCredentialId)
    .maybeSingle();

  if (error || !award) return { success: false, error: 'Learner credential not found' };

  const definition = Array.isArray(award.credentials) ? award.credentials[0] : award.credentials;
  if (!definition) return { success: false, error: 'Credential definition not found' };
  if (definition.issuer_type !== 'elevate_issued') {
    return { success: false, error: 'Only Elevate-issued credentials may be issued as native Open Badges' };
  }
  if (!definition.open_badges_enabled) {
    return { success: false, error: 'Open Badges is not enabled for this credential definition' };
  }
  if (!definition.is_active || !definition.is_published) {
    return { success: false, error: 'Credential definition must be active and published before badge issuance' };
  }
  if (award.status !== 'active') {
    return { success: false, error: `Credential status ${award.status} cannot be issued` };
  }
  if (!award.verification_code) {
    return { success: false, error: 'Verification code is required before badge issuance' };
  }

  if (award.open_badge_status === 'issued' && award.open_badge_credential) {
    return {
      success: true,
      status: 'issued',
      credential: award.open_badge_credential as OpenBadgeCredential,
      url: credentialUrl(award.verification_code),
    };
  }

  const { data: learner } = await db
    .from('profiles')
    .select('email')
    .eq('id', award.learner_id)
    .maybeSingle();

  if (!learner?.email) return { success: false, error: 'Learner email is required to bind the credential' };

  const achievementId = `${credentialUrl(award.verification_code)}#achievement`;
  const draft = buildOpenBadgeCredential({
    credentialId: award.id,
    verificationCode: award.verification_code,
    recipientIdentifier: learner.email,
    issuedAt: award.issued_at,
    expiresAt: award.expires_at,
    achievement: {
      id: achievementId,
      name: definition.name,
      description: definition.description || `${definition.name} credential`,
      achievementType: definition.achievement_type,
      criteriaNarrative: definition.achievement_criteria_narrative,
      criteriaUrl: definition.achievement_criteria_url,
      imageUrl: definition.badge_image_url,
      alignment: Array.isArray(definition.alignment) ? definition.alignment : [],
    },
  });

  const structuralErrors = validateOpenBadgeStructure(draft);
  if (structuralErrors.length) {
    await db
      .from('learner_credentials')
      .update({ open_badge_status: 'failed' })
      .eq('id', learnerCredentialId);
    return { success: false, error: structuralErrors.join('; ') };
  }

  const url = credentialUrl(award.verification_code);
  const identityHash = hashRecipientIdentifier(learner.email);

  try {
    const signed = await signCredential(draft);
    if (!signed) {
      await db
        .from('learner_credentials')
        .update({
          open_badge_credential: draft,
          open_badge_credential_url: url,
          recipient_identity_hash: identityHash,
          open_badge_status: 'pending',
          open_badge_proof_type: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', learnerCredentialId);

      return { success: true, status: 'pending_signature', credential: draft, url };
    }

    const proof = signed.proof as Record<string, unknown>;
    await db
      .from('learner_credentials')
      .update({
        open_badge_credential: signed,
        open_badge_credential_url: url,
        recipient_identity_hash: identityHash,
        open_badge_status: 'issued',
        open_badge_issued_at: new Date().toISOString(),
        open_badge_proof_type: `${String(proof.type)}:${String(proof.cryptosuite)}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', learnerCredentialId);

    return { success: true, status: 'issued', credential: signed, url };
  } catch (err) {
    logger.error('Native Open Badge issuance failed', err instanceof Error ? err : new Error(String(err)), {
      learnerCredentialId,
    });
    await db
      .from('learner_credentials')
      .update({ open_badge_status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', learnerCredentialId);
    return { success: false, error: err instanceof Error ? err.message : 'Open Badge issuance failed' };
  }
}
