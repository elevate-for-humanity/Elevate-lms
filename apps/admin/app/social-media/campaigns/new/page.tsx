import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { checkPrivilegedMfa } from '@/lib/auth/privileged-mfa';
import Link from 'next/link';
import NewSocialCampaignClient from './NewSocialCampaignClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { effectiveRoles } = await requireRole(['admin', 'staff']);
  const supabase = await createClient();
  // These source reads use the authenticated client's restrictive RLS policies.
  // Explain an AAL1 denial instead of presenting its empty rows as an empty library.
  // Keep the session client: a service-role fallback would bypass this MFA boundary.
  const assurance = await checkPrivilegedMfa(supabase, effectiveRoles);
  if (!assurance.satisfied) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">Verify access to campaign sources</h1>
        <p role="alert" className="mt-4">
          {assurance.error
            ? 'Your authentication assurance could not be verified. Try verification again before loading campaign sources.'
            : 'Multi-factor verification is required to load the campaign source library for this administrator session.'}
        </p>
        <Link
          href="/mfa?redirect=%2Fsocial-media%2Fcampaigns%2Fnew"
          className="mt-6 inline-block font-semibold underline"
        >
          Verify multi-factor authentication
        </Link>
      </main>
    );
  }
  const [programsResult, blogsResult] = await Promise.all([
    supabase.from('programs').select('id, title, slug').eq('is_active', true).order('title'),
    supabase
      .from('blog_posts')
      .select('id,title,slug,excerpt,featured_image')
      .eq('published', true)
      .eq('share_to_social', true)
      .order('published_at', { ascending: false })
      .limit(24),
  ]);
  if (programsResult.error || blogsResult.error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">Campaign sources are unavailable</h1>
        <p role="alert" className="mt-4">
          The program or article library could not be loaded. No campaign has been saved. Retry
          loading the sources before preparing a campaign.
        </p>
        <Link href="/social-media/campaigns/new" className="mt-6 inline-block font-semibold underline">
          Retry loading campaign sources
        </Link>
      </main>
    );
  }
  return (
    <NewSocialCampaignClient programs={programsResult.data ?? []} blogs={blogsResult.data ?? []} />
  );
}
