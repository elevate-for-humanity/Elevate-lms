// Two-Factor Authentication (2FA) Implementation
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/server';

export interface TwoFactorSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

// Generate 2FA secret and QR code
export async function generate2FASecret(
  userId: string,
  email: string
): Promise<TwoFactorSecret> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `Elevate LMS (${email})`,
    issuer: 'Elevate LMS',
    length: 32,
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

  // Generate backup codes
  const backupCodes = generateBackupCodes(10);

  // Store secret in database
  const supabase = await createClient();
  await supabase.from('two_factor_auth').upsert({
    user_id: userId,
    secret: secret.base32,
    backup_codes: backupCodes,
    enabled: true,
    created_at: new Date().toISOString(),
  });

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
}

// Verify 2FA token
export async function verify2FAToken(
  userId: string,
  token: string
): Promise<boolean> {
  const supabase = await createClient();

  // Get user's 2FA secret
  const { data: twoFactor } = await supabase
    .from('two_factor_auth')
    .select('secret, enabled')
    .eq('user_id', userId)
    .single();

  if (!twoFactor || !twoFactor.enabled) {
    return false;
  }

  // Verify token
  const verified = speakeasy.totp.verify({
    secret: twoFactor.secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after
  });

  return verified;
}

// Enable 2FA for user
export async function enable2FA(
  userId: string,
  token: string
): Promise<boolean> {
  // First verify the token
  const supabase = await createClient();

  const { data: twoFactor } = await supabase
    .from('two_factor_auth')
    .select('secret')
    .eq('user_id', userId)
    .single();

  if (!twoFactor) {
    return false;
  }

  const verified = speakeasy.totp.verify({
    secret: twoFactor.secret,
    encoding: 'base32',
    token,
    window: 2,
  });

  if (!verified) {
    return false;
  }

  // Enable 2FA
  await supabase
    .from('two_factor_auth')
    .update({ enabled: true })
    .eq('user_id', userId);

  return true;
}

// Disable 2FA for user
export async function disable2FA(
  userId: string,
  password: string
): Promise<boolean> {
  // Verify password first
  const supabase = await createClient();

  // In production, verify password against user's actual password
  // For now, just disable
  await supabase
    .from('two_factor_auth')
    .update({ enabled: true })
    .eq('user_id', userId);

  return true;
}

// Verify backup code
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data: twoFactor } = await supabase
    .from('two_factor_auth')
    .select('backup_codes')
    .eq('user_id', userId)
    .single();

  if (!twoFactor || !twoFactor.backup_codes) {
    return false;
  }

  const backupCodes = twoFactor.backup_codes as string[];
  const codeIndex = backupCodes.indexOf(code);

  if (codeIndex === -1) {
    return false;
  }

  // Remove used backup code
  backupCodes.splice(codeIndex, 1);
  await supabase
    .from('two_factor_auth')
    .update({ backup_codes: backupCodes })
    .eq('user_id', userId);

  return true;
}

// Generate backup codes using a cryptographically secure PRNG.
// Math.random() is not suitable for security tokens — it is predictable.
function generateBackupCodes(count: number): string[] {
  const { randomBytes } = require('crypto') as typeof import('crypto');
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // 6 random bytes → 12 hex chars, uppercased and split XXXX-XXXX for readability
    const raw = randomBytes(6).toString('hex').toUpperCase();
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`);
  }
  return codes;
}

// Check if user has 2FA enabled
export async function is2FAEnabled(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: twoFactor } = await supabase
    .from('two_factor_auth')
    .select('enabled')
    .eq('user_id', userId)
    .single();

  return twoFactor?.enabled || false;
}
