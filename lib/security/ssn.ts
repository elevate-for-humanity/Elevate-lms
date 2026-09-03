import crypto from 'crypto';
import { logger } from '@/lib/logger';

let warnedMissingSalt = false;

function getSSNSalt(): string {
  const salt = process.env.SSN_SALT?.trim();
  if (!salt) {
    if (!warnedMissingSalt && typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      warnedMissingSalt = true;
      logger.warn('SSN_SALT environment variable is not set. SSN hashing cannot proceed.');
    }
    throw new Error('SSN_SALT environment variable is required for SSN operations.');
  }
  return salt;
}

/**
 * Hash an SSN for secure storage.
 * Never store plain-text SSNs. The salt is read at operation time because
 * production secrets may be hydrated after module import.
 */
export function hashSSN(ssn: string): string {
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length !== 9) throw new Error('A valid 9-digit SSN is required.');
  return crypto
    .createHash('sha256')
    .update(cleaned + getSSNSalt())
    .digest('hex');
}

export function getSSNLast4(ssn: string): string {
  const cleaned = ssn.replace(/\D/g, '');
  return cleaned.slice(-4);
}

export function maskSSN(ssn: string): string {
  return `XXX-XX-${getSSNLast4(ssn)}`;
}

export function isValidSSN(ssn: string): boolean {
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length !== 9) return false;
  if (/^(\d)\1{8}$/.test(cleaned)) return false;
  if (['078051120', '219099999'].includes(cleaned)) return false;
  return true;
}

/**
 * Prepare SSN data for isolated secure_identity storage.
 * Returns only the hash and last four; never the full SSN.
 */
export function prepareSSNForStorage(ssn: string): { ssn_hash: string; ssn_last4: string } {
  if (!isValidSSN(ssn)) throw new Error('A valid 9-digit SSN is required.');
  return {
    ssn_hash: hashSSN(ssn),
    ssn_last4: getSSNLast4(ssn),
  };
}
