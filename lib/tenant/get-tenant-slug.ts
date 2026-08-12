import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/supabase/admin';

/**
 * Resolve the tenant website for the current request.
 *
 * Elevate subdomains arrive from middleware as `x-tenant-slug`.
 * Customer-owned domains arrive as `x-tenant-host`; those must be resolved
 * through website_domains before the tenant renderer can load the site.
 */
export async function getTenantSlugFromHeaders(): Promise<string | null> {
  const h = await headers();
  const directSlug = h.get('x-tenant-slug')?.trim().toLowerCase();
  if (directSlug) return directSlug;

  const customHost = h.get('x-tenant-host')?.split(':')[0]?.trim().toLowerCase();
  if (!customHost) return null;

  const db = await getAdminClient();
  if (!db) return null;

  const { data: domain, error: domainError } = await db
    .from('website_domains')
    .select('website_id, status')
    .ilike('hostname', customHost)
    .eq('status', 'active')
    .maybeSingle();

  if (domainError || !domain?.website_id) return null;

  const { data: website, error: websiteError } = await db
    .from('user_websites')
    .select('subdomain, is_published')
    .eq('id', domain.website_id)
    .eq('is_published', true)
    .maybeSingle();

  if (websiteError || !website?.subdomain) return null;
  return String(website.subdomain).trim().toLowerCase() || null;
}
