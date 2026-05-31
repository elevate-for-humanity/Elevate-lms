import { requireAdminClient } from '@/lib/supabase/admin';
import { tenantPublicSiteUrl } from '@/lib/tenant/public-site-url';

export async function publishWebsite(
  websiteId: string,
  subdomain: string,
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  const db = await requireAdminClient();
  const slug = subdomain.trim().toLowerCase();
  if (!slug) return { ok: false, error: 'Subdomain required' };

  const { data: taken } = await db
    .from('user_websites')
    .select('id')
    .eq('subdomain', slug)
    .eq('is_published', true)
    .neq('id', websiteId)
    .maybeSingle();

  if (taken) return { ok: false, error: 'Subdomain already in use' };

  const { error } = await db
    .from('user_websites')
    .update({
      subdomain: slug,
      is_published: true,
      status: 'published',
      updated_at: new Date().toISOString(),
    })
    .eq('id', websiteId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, publicUrl: tenantPublicSiteUrl(slug) };
}
