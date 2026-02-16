import crypto from 'crypto';

const SSN_SALT = process.env.SSN_SALT;

if (!SSN_SALT && typeof window === 'undefined') {
  // Server-side only: SSN_SALT is required for any SSN operations
  console.error('[SECURITY] SSN_SALT environment variable is not set. SSN hashing will fail.');
}

/**
 * Hash an SSN for secure storage
 * Never store plain-text SSNs - always use this function
 */
export function hashSSN(ssn: string): string {
  if (!SSN_SALT) {
    throw new Error('SSN_SALT environment variable is required for SSN operations.');
  }
  const cleaned = ssn.replace(/\D/g, '');
  return crypto.createHash('sha256').update(cleaned + SSN_SALT).digest('hex');
}

/**
 * Get last 4 digits of SSN for display/lookup purposes
 */
export function getSSNLast4(ssn: string): string {
  const cleaned = ssn.replace(/\D/g, '');
  return cleaned.slice(-4);
}

/**
 * Mask SSN for display (XXX-XX-1234)
 */
export function maskSSN(ssn: string): string {
  const last4 = getSSNLast4(ssn);
  return `XXX-XX-${last4}`;
}

/**
 * Validate SSN format (9 digits)
 */
export function isValidSSN(ssn: string): boolean {
  const cleaned = ssn.replace(/\D/g, '');
  return cleaned.length === 9;
}

/**
 * Prepare SSN data for secure storage
 * Returns object with hash and last4, never the full SSN
 */
export function prepareSSNForStorage(ssn: string): { ssn_hash: string; ssn_last4: string } {
  return {
    ssn_hash: hashSSN(ssn),
    ssn_last4: getSSNLast4(ssn),
  };
}
