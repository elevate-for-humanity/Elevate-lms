import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { buildDefaultSiteConfig, mergeSiteConfig } from '@/lib/tenant/default-site-config';
import { bridgeLegacyPatchIntoComposition } from '@/lib/tenant/legacy-composition-bridge';
import { validateSiteConfig } from '@/lib/tenant/site-validation';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';
import { loadVerifiedWebsiteClaims } from '@/lib/tenant/website-claims';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SiteRow = {
  id: string;
  user_id: string | null;
  site_name: string | null;
  subdomain: string | null;
  site_config: unknown;
  is_published: boolean | null;
};

function parseSubdomain(value: unknown): { valid: boolean; value: string | null } {
  if (typeof value !== 'string') return { valid: false, value: null };
  const slug = value.trim().toLowerCase();
  if (!slug) return { valid: true, value: null };
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug)) return { valid: false, value: null };
  return { valid: true, value: slug };
}

async function loadOwnedSite(supabase: Awaited<ReturnType<typeof requireAdminClient>>, websiteId: string, userId: string) {
  const { data: site, error } = await supabase
    .from('user_websites')
    .select('id, user_id, site_name, subdomain, site_config, is_published')
    .eq('id', websiteId)
    .maybeSingle();
  if (error) return { site: null, error };
  if (!site || site.user_id !== userId) return { site: null, error: null };
  return { site: site as SiteRow, error: null };
}

async function snapshotRevision(supabase: Awaited<ReturnType<typeof requireAdminClient>>, site: SiteRow, userId: string, reason: string) {
  await supabase.from('website_revisions').insert({
    website_id: site.id,
    user_id: userId,
    site_name: site.site_name,
    subdomain: site.subdomain,
    site_config: site.site_config && typeof site.site_config === 'object' ? site.site_config : {},
    is_published: Boolean(site.is_published),
    reason,
  }).then(() => undefined, () => undefined);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const access = await getWebsiteBuilderAccess(user.id, supabase);
  if (!access.allowed) return NextResponse.json({ error: 'Website Builder subscription or active trial required', reason: access.reason }, { status: 403 });

  const admin = await requireAdminClient();
  const { site, error: readError } = await loadOwnedSite(admin, websiteId, user.id);
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!site) return NextResponse.json({ error: 'Website not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const siteName = typeof body.siteName === 'string' && body.siteName.trim() ? body.siteName.trim().slice(0, 120) : site.site_name || 'My Site';
  const base = buildDefaultSiteConfig({ organizationName: siteName });
  const existing = site.site_config && typeof site.site_config === 'object' ? mergeSiteConfig(base, site.site_config as Partial<TenantSiteConfig>) : base;
  const configPatch = body.siteConfig && typeof body.siteConfig === 'object' ? body.siteConfig as Partial<TenantSiteConfig> : {};
  const merged = bridgeLegacyPatchIntoComposition(mergeSiteConfig(existing, configPatch), configPatch);

  // Verification state is server authority. Never trust claims embedded in a
  // browser-supplied site_config, even when the rest of the draft is editable.
  try {
    merged.claims = await loadVerifiedWebsiteClaims(admin, websiteId);
  } catch {
    return NextResponse.json({ error: 'Claim verification service is unavailable; the website was not saved or published.' }, { status: 503 });
  }

  const update: Record<string, unknown> = { site_name: siteName, site_config: merged, updated_at: new Date().toISOString() };

  let requestedSubdomain: string | null | undefined;
  if (body.subdomain !== undefined) {
    const parsed = parseSubdomain(body.subdomain);
    if (!parsed.valid) return NextResponse.json({ error: 'Subdomain can contain only letters, numbers, and hyphens' }, { status: 400 });
    requestedSubdomain = parsed.value;
    if (requestedSubdomain) {
      const { data: taken } = await admin.from('user_websites').select('id').eq('subdomain', requestedSubdomain).neq('id', websiteId).maybeSingle();
      if (taken) return NextResponse.json({ error: 'That subdomain is already in use' }, { status: 409 });
    }
    update.subdomain = requestedSubdomain;
  }

  let validation = validateSiteConfig(merged);
  if (body.publish === true) {
    const target = requestedSubdomain !== undefined ? requestedSubdomain : site.subdomain;
    if (!target) return NextResponse.json({ error: 'Choose a valid subdomain before publishing' }, { status: 400 });
    if (!validation.valid) {
      return NextResponse.json({
        error: 'Website failed pre-publish QA. Fix the blocking issues before publishing.',
        validation,
      }, { status: 422 });
    }
    update.subdomain = target;
    update.is_published = true;
    update.status = 'published';
  } else if (body.publish === false) {
    update.is_published = false;
    update.status = 'draft';
  }

  const reason = body.publish === true ? 'publish' : body.publish === false ? 'unpublish' : 'save';
  await snapshotRevision(admin, site, user.id, reason);

  const { data: saved, error: saveError } = await admin.from('user_websites').update(update).eq('id', websiteId).eq('user_id', user.id).select('id, site_name, subdomain, is_published, site_config').maybeSingle();
  if (saveError || !saved) return NextResponse.json({ error: saveError?.message || 'Could not save website' }, { status: 500 });

  validation = validateSiteConfig(saved.site_config as TenantSiteConfig);
  const publicUrl = saved.subdomain && saved.is_published ? `https://${saved.subdomain}.app.elevateforhumanity.org` : null;
  return NextResponse.json({ website: saved, publicUrl, validation });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const access = await getWebsiteBuilderAccess(user.id, supabase);
  if (!access.allowed) return NextResponse.json({ error: 'Website Builder subscription or active trial required', reason: access.reason }, { status: 403 });

  const admin = await requireAdminClient();
  const { site, error: readError } = await loadOwnedSite(admin, websiteId, user.id);
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!site) return NextResponse.json({ error: 'Website not found' }, { status: 404 });

  const { error } = await admin.from('user_websites').delete().eq('id', websiteId).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
