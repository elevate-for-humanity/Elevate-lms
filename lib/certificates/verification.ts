import { createClient } from '@/lib/supabase/server';

/**
 * Generate a unique verification code for a certificate
 */
export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0, O, 1, I)
  const segments = [];
  
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join('-'); // Format: XXXX-XXXX-XXXX
}

/**
 * Get the verification URL for a certificate
 */
export function getVerificationUrl(code: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  return `${baseUrl}/verify/${code}`;
}

/**
 * Generate QR code data URL for a verification code
 * Uses a simple QR code API - in production, use a library like 'qrcode'
 */
export function getQRCodeUrl(verificationCode: string, size: number = 200): string {
  const verificationUrl = getVerificationUrl(verificationCode);
  // Using QR Server API (free, no API key needed)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(verificationUrl)}`;
}

/**
 * Verify a certificate by its code
 */
export async function verifyCertificate(code: string) {
  const supabase = await createClient();
  
  const { data: certificate, error } = await supabase
    .from('certificates')
    .select(`
      *,
      profiles:user_id (full_name, email),
      programs:program_id (name, slug)
    `)
    .eq('verification_code', code)
    .single();

  if (error || !certificate) {
    return { valid: false, certificate: null, error: 'Certificate not found' };
  }

  const isExpired = certificate.expires_at && new Date(certificate.expires_at) < new Date();
  const isRevoked = certificate.status === 'revoked';
  const isValid = !isExpired && !isRevoked && (certificate.status === 'active' || certificate.status === 'issued');

  return {
    valid: isValid,
    certificate,
    error: isExpired ? 'Certificate expired' : isRevoked ? 'Certificate revoked' : null,
  };
}

/**
 * Issue a new certificate with verification code
 */
export async function issueCertificate({
  userId,
  programId,
  programName,
  recipientName,
  completionDate,
  expiresAt,
}: {
  userId: string;
  programId?: string;
  programName: string;
  recipientName: string;
  completionDate?: Date;
  expiresAt?: Date;
}) {
  const supabase = await createClient();
  const verificationCode = generateVerificationCode();
  
  const { data, error } = await supabase
    .from('certificates')
    .insert({
      user_id: userId,
      program_id: programId,
      program_name: programName,
      recipient_name: recipientName,
      verification_code: verificationCode,
      status: 'issued',
      issued_at: completionDate || new Date().toISOString(),
      expires_at: expiresAt?.toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to issue certificate`);
  }

  return {
    certificate: data,
    verificationCode,
    verificationUrl: getVerificationUrl(verificationCode),
    qrCodeUrl: getQRCodeUrl(verificationCode),
  };
}
