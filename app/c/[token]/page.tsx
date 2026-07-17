// =====================================================
// CREDENTIAL SHARE LINK VERIFICATION PAGE
// /c/<token> → validates & displays credential details with full UI
// No redirects — all states (valid, expired, invalid, used) render inline
// =====================================================

import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import CredentialShareClient from './CredentialShareClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Verify Digital Credential',
  description: 'View and verify a digital credential from Elevate For Humanity.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/c/' },
};

interface ValidationResult {
  status: 'valid' | 'invalid' | 'expired' | 'used';
  shareLink?: any;
  credential?: any;
  errorMessage?: string;
}

async function validateToken(token: string): Promise<ValidationResult> {
  try {
    const supabase = await createServerSupabaseClient();

    // Lookup share token
    const { data: shareLink, error } = await supabase
      .from('credential_share_links')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (error || !shareLink) {
      logger.warn('Invalid share token', { token });
      return {
        status: 'invalid',
        errorMessage: 'This credential link is invalid or no longer exists.',
      };
    }

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(shareLink.expires_at);

    if (expiresAt < now) {
      logger.info('Expired share token', { token });
      return {
        status: 'expired',
        errorMessage: 'This credential link has expired.',
      };
    }

    // Check if one-time use and already used
    if (shareLink.one_time_use && shareLink.used_at) {
      logger.info('Share token already used', { token });
      return {
        status: 'used',
        errorMessage: 'This credential link has already been accessed.',
      };
    }

    // Fetch credential details
    const { data: credential } = await supabase
      .from('credentials')
      .select('*')
      .eq('id', shareLink.credential_id)
      .maybeSingle();

    // Mark as used if one-time
    if (shareLink.one_time_use) {
      await supabase
        .from('credential_share_links')
        .update({ used_at: new Date().toISOString() })
        .eq('id', shareLink.id);
    }

    // Log access
    await supabase.from('audit_logs').insert({
      event_type: 'credential_shared',
      resource_type: 'credential',
      resource_id: shareLink.credential_id,
      metadata: {
        token,
        share_link_id: shareLink.id,
      },
    });

    return {
      status: 'valid',
      shareLink,
      credential,
    };
  } catch (err) {
    logger.error('Token validation error', { token, error: err });
    return {
      status: 'invalid',
      errorMessage: 'An error occurred while validating this credential link.',
    };
  }
}

export default async function CredentialSharePage({ params }: PageProps) {
  const { token } = await params;
  const validation = await validateToken(token);

  return (
    <CredentialShareClient
      token={token}
      validation={validation}
    />
  );
}
