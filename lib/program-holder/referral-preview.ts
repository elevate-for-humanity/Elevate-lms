import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

type ReferralBatch = {
  actorId: string;
  holderId: string;
  programId: string;
  limit: number;
  applicationIds: string[];
};

function signature(batch: ReferralBatch, expiresAt: number) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Referral preview signing is unavailable.');
  const { actorId, holderId, programId, limit, applicationIds } = batch;
  return createHmac('sha256', key)
    .update(JSON.stringify(['holder-referral-preview-v1', actorId, holderId, programId, limit, applicationIds, expiresAt]))
    .digest();
}

export function createReferralPreview(batch: ReferralBatch) {
  const expiresAt = Date.now() + 10 * 60 * 1000;
  return `${expiresAt}.${signature(batch, expiresAt).toString('base64url')}`;
}

export function verifyReferralPreview(token: string, batch: ReferralBatch): boolean {
  const match = /^(\d{13})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return false;
  const expiresAt = Number(match[1]);
  if (expiresAt <= Date.now()) return false;
  const supplied = Buffer.from(match[2], 'base64url');
  const expected = signature(batch, expiresAt);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
