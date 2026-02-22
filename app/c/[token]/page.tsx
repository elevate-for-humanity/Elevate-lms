// =====================================================
import { createAdminClient } from '@/lib/supabase/admin';
// CREDENTIAL SHARE LINK HANDOFF
// /c/<token> → validates → redirects to verifier or partner portal
// =====================================================

import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}


export const metadata: Metadata = {
  title: 'Token',
  alternates: { canonical: 'https://www.elevateforhumanity.org/c/' },
};

export default async function CredentialSharePage({ params }: PageProps) {
  const { token } = await params;

  const supabase = await createServerSupabaseClient();

  // Lookup share token
  const { data: shareLink, error } = await db
    .from('credential_share_links')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !shareLink) {
    logger.warn('Invalid share token', { token });
    redirect('/verify-credential?error=invalid_token');
  }

  // Check expiration
  const now = new Date();
  const expiresAt = new Date(shareLink.expires_at);

  if (expiresAt < now) {
    logger.info('Expired share token', { token });
    redirect('/verify-credential?error=expired_token');
  }

  // Check if one-time use and already used
  if (shareLink.one_time_use && shareLink.used_at) {
    logger.info('Share token already used', { token });
    redirect('/verify-credential?error=token_used');
  }

  // Mark as used if one-time
  if (shareLink.one_time_use) {
    await db
      .from('credential_share_links')
      .update({ used_at: new Date().toISOString() })
      .eq('id', shareLink.id);
  }

  // Log access
  await db.from('audit_logs').insert({
    event_type: 'credential_shared',
    resource_type: 'credential',
    resource_id: shareLink.credential_id,
    metadata: {
      token,
      share_link_id: shareLink.id,
    },
  });

  // Redirect to verification page with code
  redirect(`/verify-credential?code=${shareLink.credential_code}`);
}
