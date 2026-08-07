import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildDefaultSiteConfig, mergeSiteConfig } from '@/lib/tenant/default-site-config';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeSubdomain(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const slug = value.trim().toLowerCase();
  if (!slug) return null;
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug)) return null;
  return slug;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const { websiteId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: site, error: readError } = await supabase
    .from('user_websites')
    .select('id, user_id, site_name, subdomain, site_config, is_published')
    .eq('id', websiteId)
    .maybeSingle();

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!site || site.user_id !== user.id) return NextResponse.json({ error: 'Website not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const siteName = typeof body.siteName === 'string' && body.siteName.trim() ? body.siteName.trim().slice(0, 120) : site.site_name || 'My Site';
  const base = buildDefaultSiteConfig({ organizationName: siteName });
  const existing = site.site_config && typeof site.site_config === 'object'
    ? mergeSiteConfig(base, site.site_config as Partial<TenantSiteConfig>)
    : base;
  const configPatch = body.siteConfig && typeof body.siteConfig === 'object' ? body.siteConfig as Partial<TenantSiteConfig> : {};
  const merged = mergeSiteConfig(existing, configPatch);

  const update: Record<string, unknown> = {
    site_name: siteName,
    site_config: merged,
    updated_at: new Date().toISOString(),
  };

  if (body.subdomain !== undefined) {
    const subdomain = normalizeSubdomain(body.subdomain);
    if (!subdomain) return NextResponse.json({ error: 'Enter a valid subdomain' }, { status: 400 });

    const { data: taken } = await supabase
      .from('user_websites')
      .select('id')
      .eq('subdomain', subdomain)
      .neq('id', websiteId)
      .maybeSingle();
    if (taken) return NextResponse.json({ error: 'That subdomain is already in use' }, { status: 409 });
    update.subdomain = subdomain;
  }

  if (body.publish === true) {
    const targetSubdomain = normalizeSubdomain(body.subdomain ?? site.subdomain);
    if (!targetSubdomain) return NextResponse.json({ error: 'A valid subdomain is required before publishing' }, { status: 400 });
    update.subdomain = targetSubdomain;
    update.is_published = true;
    update.status = 'published';
  }

  const { data: saved, error: saveError } = await supabase
    .from('user_websites')
    .update(update)
    .eq('id', websiteId)
    .select('id, site_name, subdomain, is_published, site_config')
    .maybeSingle();

  if (saveError || !saved) {
    return NextResponse.json({ error: saveError?.message || 'Could not save website' }, { status: 500 });
  }

  const publicUrl = saved.subdomain && saved.is_published
    ? `https://${saved.subdomain}.app.elevateforhumanity.org`
    : null;

  return NextResponse.json({ website: saved, publicUrl });
}
