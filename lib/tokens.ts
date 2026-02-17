import { logger } from '@/lib/logger';
/**
 * Token Link System
 * 
 * Provides controlled access without login for:
 * - Host shop hour submissions
 * - School transfer submissions
 * - CE submissions
 * 
 * Tokens are:
 * - Single-purpose
 * - Expirable
 * - Usage-limited
 * - INSERT-only (cannot update, approve, or delete)
 */

import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export type TokenPurpose = 'host_shop_hours' | 'school_transfer' | 'ce_submission';

export interface AccessToken {
  id: string;
  token: string;
  purpose: TokenPurpose;
  apprentice_application_id: string | null;
  host_shop_application_id: string | null;
  expires_at: string;
  max_uses: number;
  uses_count: number;
  created_at: string;
}

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Create a new access token
 */
export async function createAccessToken(params: {
  purpose: TokenPurpose;
  apprentice_application_id?: string;
  host_shop_application_id?: string;
  expires_in_days?: number;
  max_uses?: number;
}): Promise<{ token: string; expires_at: string } | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (params.expires_in_days || 30));

  const { data, error } = await supabase
    .from('access_tokens')
    .insert({
      token,
      purpose: params.purpose,
      apprentice_application_id: params.apprentice_application_id || null,
      host_shop_application_id: params.host_shop_application_id || null,
      expires_at: expiresAt.toISOString(),
      max_uses: params.max_uses || 100,
      uses_count: 0,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating access token:', error);
    return null;
  }

  return {
    token: data.token,
    expires_at: data.expires_at,
  };
}

/**
 * Validate and consume a token
 * Returns the token record if valid, null if invalid/expired/overused
 */
export async function validateToken(
  token: string,
  expectedPurpose: TokenPurpose
): Promise<AccessToken | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  // Fetch token
  const { data, error } = await supabase
    .from('access_tokens')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !data) {
    return null;
  }

  // Check purpose
  if (data.purpose !== expectedPurpose) {
    return null;
  }

  // Check expiration
  if (new Date(data.expires_at) < new Date()) {
    return null;
  }

  // Check usage limit
  if (data.uses_count >= data.max_uses) {
    return null;
  }

  // Increment usage count
  await supabase
    .from('access_tokens')
    .update({ uses_count: data.uses_count + 1 })
    .eq('id', data.id);

  return data as AccessToken;
}

/**
 * Generate a full token URL for a specific purpose
 */
export function getTokenUrl(token: string, purpose: TokenPurpose): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  
  switch (purpose) {
    case 'host_shop_hours':
      return `${baseUrl}/portal/hours/submit?token=${token}`;
    case 'school_transfer':
      return `${baseUrl}/lms/transfer-hours?token=${token}`;
    case 'ce_submission':
      return `${baseUrl}/portal/ce/submit?token=${token}`;
    default:
      return `${baseUrl}?token=${token}`;
  }
}
