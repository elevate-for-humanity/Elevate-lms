import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import NewSocialCampaignClient from './NewSocialCampaignClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireRole(['admin', 'staff']);
  const supabase = await createClient();
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
  return (
    <NewSocialCampaignClient programs={programsResult.data ?? []} blogs={blogsResult.data ?? []} />
  );
}
