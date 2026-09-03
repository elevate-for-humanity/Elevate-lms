import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildDefaultSiteConfig, mergeSiteConfig } from '@/lib/tenant/default-site-config';
import { validateSiteConfig } from '@/lib/tenant/site-validation';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const access = await getWebsiteBuilderAccess(user.id, supabase);
  if (!access.allowed) return NextResponse.json({ error: 'Website Builder subscription or active trial required', reason: access.reason, upgradeUrl: access.upgradeUrl }, { status: 403 });

  const { data: site, error } = await supabase.from('user_websites').select('id, user_id, site_name, site_config').eq('id', websiteId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!site || site.user_id !== user.id) return NextResponse.json({ error: 'Website not found' }, { status: 404 });

  const base = buildDefaultSiteConfig({ organizationName: site.site_name || 'My Website' });
  const config = site.site_config && typeof site.site_config === 'object' ? mergeSiteConfig(base, site.site_config as Partial<TenantSiteConfig>) : base;
  return NextResponse.json(validateSiteConfig(config));
}
