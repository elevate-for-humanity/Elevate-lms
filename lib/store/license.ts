import * as crypto from 'node:crypto';

/**
 * Generate a unique license key with high entropy
 * Format: EFH-{24 hex chars}-{24 hex chars}
 * Total entropy: 192 bits (12 bytes * 2)
 */
export function generateLicenseKey(): string {
  const part1 = crypto.randomBytes(12).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(12).toString('hex').toUpperCase();
  return `EFH-${part1}-${part2}`;
}

/**
 * Validate license key format
 * Supports both legacy format and new EFH format
 */
export function isValidLicenseKeyFormat(key: string): boolean {
  // New format: EFH-{24 hex}-{24 hex}
  const newPattern = /^EFH-[A-F0-9]{24}-[A-F0-9]{24}$/;
  // Legacy format: {8 hex}-{8 hex}-{8 hex}-{8 hex}
  const legacyPattern = /^[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/;

  return newPattern.test(key) || legacyPattern.test(key);
}

/**
 * Hash license key for storage
 */
export function hashLicenseKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Verify license key against hash
 */
export function verifyLicenseKey(key: string, hash: string): boolean {
  return hashLicenseKey(key) === hash;
}

/**
 * Generate license metadata
 */
export function generateLicenseMetadata(email: string, productId: string) {
  return {
    email,
    productId,
    issuedAt: new Date().toISOString(),
    expiresAt: null, // null = lifetime license
    maxActivations: 1,
    activations: 0,
  };
}
