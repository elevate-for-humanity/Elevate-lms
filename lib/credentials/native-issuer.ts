import { requireAdminClient } from '@/lib/supabase/admin';
import { setAuditContext } from '@/lib/audit-context';
import { logger } from '@/lib/logger';
import {
  buildOpenBadgeCredential,
  createRecipientSalt,
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

function firstProof(credential: OpenBadgeCredential): Record<string, unknown> | undefined {
  if (!credential.proof) return undefined;
  return Array.isArray(credential.proof) ? credential.proof[0] : credential.proof;
}

function resolveSigningService(): { url: string; token: string } | null {
  const explicitUrl = process.env.OPEN_BADGES_SIGNING_SERVICE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const url = explicitUrl || (supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/functions/v1/open-badges-sign` : '');
  const token =
    process.env.OPEN_BADGES_SIGNING_SERVICE_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!url || !token) return null;
  return { url, token };
}

async function signCredential(
  credential: OpenBadgeCredential,
): Promise<OpenBadgeCredential | null> {
  const signer = resolveSigningService();
  if (!signer) return null;

  const response = await fetch(signer.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${signer.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ credential }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Open Badges signing service returned ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`,
    );
  }

  const signed = (await response.json()) as OpenBadgeCredential;
  const proof = firstProof(signed);
  const proofType = String(proof?.type ?? '');
  const cryptosuite = String(proof?.cryptosuite ?? '');
  const proofPurpose = String(proof?.proofPurpose ?? '');
  const verificationMethod = String(proof?.verificationMethod ?? '');
  const proofValue = String(proof?.proofValue ?? '');

  if (!ALLOWED_PROOF_TYPES.has(proofType) || !ALLOWED_CRYPTOSUITES.has(cryptosuite)) {
    throw new Error(
      'Signing service returned a proof outside the approved Open Badges 3.0 cryptosuites',
    );
  }
  if (proofPurpose !== 'assertionMethod' || !verificationMethod || !proofValue) {
    throw new Error('Signing service returned an incomplete Data Integrity proof');
  }

  return signed;
}

/**
 * Issues an Elevate-owned Open Badge from the canonical learner_credentials row.
 * Only credentials owned by an internal credentialing partner may use this path.
 */
export async function issueNativeOpenBadge(
  learnerCredentialId: string,
): Promise<NativeIssueResult> {
  const db = await requireAdminClient();
  await setAuditContext(db, { systemActor: 'native_open_badge_issuer' });

  const { data: award, error } = await db
    .from('learner_credentials')
    .select(
      'id, learner_id, credential_id, verification_code, issued_at, expires_at, status, open_badge_status, open_badge_credential, recipient_identity_salt',
    )
    .eq('id', learnerCredentialId)
    .maybeSingle();

  if (error || !award) return { success: false, error: 'Learner credential not found' };

  const { data: definition, error: definitionError } = await db
    .from('credentials')
    .select(
      'id, name, description, partner_id, issuing_authority, open_badges_enabled, achievement_type, achievement_criteria_narrative, achievement_criteria_url, badge_image_url, alignment',
    )
    .eq('id', award.credential_id)
    .maybeSingle();

  if (definitionError || !definition) {
    return { success: false, error: 'Credential definition not found' };
  }

  if (!definition.partner_id) {
    return {
      success: false,
      error: 'Credential must have an internal credentialing partner before native badge issuance',
    };
  }

  const { data: partner } = await db
    .from('credentialing_partners')
    .select('name, type')
    .eq('id', definition.partner_id)
    .maybeSingle();

  if (partner?.type !== 'internal') {
    return {
      success: false,
      error: 'Only credentials owned by an internal issuer may be issued as native Open Badges',
    };
  }
  if (!definition.open_badges_enabled) {
    return { success: false, error: 'Open Badges is not enabled for this credential definition' };
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

  if (!learner?.email) {
    return { success: false, error: 'Learner email is required to bind the credential' };
  }

  const recipientSalt = award.recipient_identity_salt || createRecipientSalt();
  const identityHash = hashRecipientIdentifier(learner.email, recipientSalt);
  const achievementId = `${credentialUrl(award.verification_code)}#achievement`;
  const draft = buildOpenBadgeCredential({
    credentialId: award.id,
    verificationCode: award.verification_code,
    recipientIdentifier: learner.email,
    recipientSalt,
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

  try {
    const signed = await signCredential(draft);
    if (!signed) {
      await db
        .from('learner_credentials')
        .update({
          open_badge_credential: draft,
          open_badge_credential_url: url,
          recipient_identity_hash: identityHash,
          recipient_identity_salt: recipientSalt,
          recipient_identity_type: 'email',
          open_badge_status: 'pending',
          open_badge_proof_type: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', learnerCredentialId);

      return { success: true, status: 'pending_signature', credential: draft, url };
    }

    const proof = firstProof(signed)!;
    await db
      .from('learner_credentials')
      .update({
        open_badge_credential: signed,
        open_badge_credential_url: url,
        recipient_identity_hash: identityHash,
        recipient_identity_salt: recipientSalt,
        recipient_identity_type: 'email',
        open_badge_status: 'issued',
        open_badge_issued_at: new Date().toISOString(),
        open_badge_proof_type: `${String(proof.type)}:${String(proof.cryptosuite)}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', learnerCredentialId);

    return { success: true, status: 'issued', credential: signed, url };
  } catch (err) {
    logger.error(
      'Native Open Badge issuance failed',
      err instanceof Error ? err : new Error(String(err)),
      { learnerCredentialId },
    );
    await db
      .from('learner_credentials')
      .update({
        open_badge_status: 'failed',
        recipient_identity_salt: recipientSalt,
        recipient_identity_hash: identityHash,
        recipient_identity_type: 'email',
        updated_at: new Date().toISOString(),
      })
      .eq('id', learnerCredentialId);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Open Badge issuance failed',
    };
  }
}
