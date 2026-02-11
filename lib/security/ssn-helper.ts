/**
 * SSN Security Helper
 * Handles secure SSN operations for tax filing
 */

import crypto from 'crypto';

// Encryption key MUST come from environment — random fallback would cause data loss on serverless cold starts
const ENCRYPTION_KEY = process.env.SSN_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY && typeof window === 'undefined') {
  console.error('[SECURITY] SSN_ENCRYPTION_KEY is not set. SSN encrypt/decrypt operations will fail.');
}
const IV_LENGTH = 16;

export function encryptSSN(ssn: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('SSN_ENCRYPTION_KEY is not configured. Cannot encrypt SSN data.');
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(ssn, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptSSN(encryptedSSN: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('SSN_ENCRYPTION_KEY is not configured. Cannot decrypt SSN data.');
  }
  const parts = encryptedSSN.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function maskSSN(ssn: string): string {
  const clean = ssn.replace(/\D/g, '');
  if (clean.length !== 9) return '***-**-****';
  return `***-**-${clean.slice(-4)}`;
}

export function formatSSN(ssn: string): string {
  const clean = ssn.replace(/\D/g, '');
  if (clean.length !== 9) return ssn;
  return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5)}`;
}

export function validateSSN(ssn: string): boolean {
  const clean = ssn.replace(/\D/g, '');
  if (clean.length !== 9) return false;
  
  // Cannot start with 9 (reserved for ITINs)
  if (clean.startsWith('9')) return false;
  
  // Cannot be all zeros in any group
  if (clean.slice(0, 3) === '000') return false;
  if (clean.slice(3, 5) === '00') return false;
  if (clean.slice(5) === '0000') return false;
  
  // Cannot be known invalid numbers
  const invalid = ['078051120', '219099999', '123456789'];
  if (invalid.includes(clean)) return false;
  
  return true;
}
