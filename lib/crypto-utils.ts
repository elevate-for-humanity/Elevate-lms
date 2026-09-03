// =====================================================
// CRYPTOGRAPHIC UTILITIES
// Non-guessable codes and secure hashing
// =====================================================

import * as crypto from 'node:crypto';

/**
 * Generate non-guessable credential code
 * Format: crd_<40 hex chars>
 */
export function randomCredentialCode(): string {
  const raw = crypto.randomBytes(20).toString('hex');
  return `crd_${raw}`;
}

/**
 * Generate share token for credential links
 * Format: <64 hex chars>
 */
export function randomShareToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * SHA-256 hash for token storage
 */
export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Generate secure random string
 */
export function randomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Constant-time string comparison (prevents timing attacks)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
