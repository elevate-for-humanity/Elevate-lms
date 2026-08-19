import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { startWorkspaceTrial } from '@/lib/workspace/start-workspace-trial';
import { ensureTrialOwnerAccess } from '@/lib/workspace/ensure-trial-owner-access';
import { mergeSiteConfig, type TenantSiteConfigPatch } from '@/lib/tenant/default-site-config';
import type { TenantSiteConfig, TenantSiteProduct } from '@/lib/tenant/site-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type SitePatch = TenantSiteConfigPatch;

function text(value: unknown, max = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringArray(value: unknown, maxItems = 12, maxLength = 120): string[] {
  return Array.isArray(value)
    ? value.map((item) => text(item, maxLength)).filter(Boolean).slice(0, maxItems)
    : [];
}

function features(value: unknown): TenantSiteConfig['homepage']['features'] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rows = value.slice(0, 8).map((item) => {
    const row = object(item);
    const title = text(row.title, 90);
    const description = text(row.description, 280);
    if (!title) return null;
    const image = text(row.image, 500);
    return { title, description, ...(image ? { image } : {}) };
  }).filter((row): row is NonNullable<typeof row> => Boolean(row));
  return rows.length ? rows : undefined;
}

function programs(value: unknown): TenantSiteConfig['programs'] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rows = value.slice(0, 12).map((item) => {
    const row = object(item);
    const name = text(row.name, 100);
    if (!name) return null;
    const description = text(row.description, 320);
    const duration = text(row.duration, 80);
    const level = text(row.level, 80);
    const image = text(row.image, 500);
    return { name, description, ...(duration ? { duration } : {}), ...(level ? { level } : {}), ...(image ? { image } : {}) };
  }).filter((row): row is NonNullable<typeof row> => Boolean(row));
  return rows.length ? rows : undefined;
}

function products(value: unknown): TenantSiteProduct[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rows = value.slice(0, 30).map((item) => {
    const row = object(item);
    const name = text(row.name, 120);
    if (!name) return null;
    const product: TenantSiteProduct = { name };
    const description = text(row.description, 500);
    const price = text(row.price, 40);
    const compareAtPrice = text(row.compareAtPrice, 40);
    const image = text(row.image, 700);
    const imageAlt = text(row.imageAlt, 180);
    const href = text(row.href, 700);
    const category = text(row.category, 100);
    const badge = text(row.badge, 60);
    if (description) product.description = description;
    if (price) product.price = price;
    if (compareAtPrice) product.compareAtPrice = compareAtPrice;
    if (image) product.image = image;
    if (imageAlt) product.imageAlt = imageAlt;
    if (href) product.href = href;
    if (category) product.category = category;
    if (badge) product.badge = badge;
    return product;
  }).filter((row): row is TenantSiteProduct => Boolean(row));
  return rows.length ? rows : undefined;
}

function sitePatchFromDemo(state: Record<string, unknown>): SitePatch | null {
  const raw = object(state.siteConfig);
  if (!Object.keys(raw).length) return null;
  const brandingRaw = object(raw.branding);
  const homepageRaw = object(raw.homepage);
  const contactRaw = object(raw.contact);
  const seoRaw = object(raw.seo);
  const patch: SitePatch = {};

  const branding: Partial<TenantSiteConfig['branding']> = {};
  for (const [key, max] of [['logoText', 100], ['tagline', 180], ['primaryColor', 30], ['secondaryColor', 30], ['accentColor', 30], ['backgroundColor', 30], ['textColor', 30], ['logoImage', 700]] as const) {
    const value = text(brandingRaw[key], max);
    if (value) (branding as Record<string, unknown>)[key] = value;
  }
  if (Object.keys(branding).length) patch.branding = branding;

  const homepage: Partial<TenantSiteConfig['homepage']> = {};
  for (const [key, max] of [['heroTitle', 150], ['heroSubtitle', 380], ['heroCtaText', 70], ['heroCtaHref', 500], ['heroImage', 700], ['heroImageAlt', 180], ['announcement', 180]] as const) {
    const value = text(homepageRaw[key], max);
    if (value) (homepage as Record<string, unknown>)[key] = value;
  }
  const featureRows = features(homepageRaw.features);
  if (featureRows) homepage.features = featureRows;
  if (Object.keys(homepage).length) patch.homepage = homepage;

  const programRows = programs(raw.programs);
  if (programRows) patch.programs = programRows;
  const productRows = products(raw.products);
  if (productRows) patch.products = productRows;

  const navigation = Array.isArray(raw.navigation)
    ? raw.navigation.slice(0, 12).map((item) => {
        const row = object(item);
        return { label: text(row.label, 60), href: text(row.href, 500) };
      }).filter((row) => row.label && row.href)
    : [];
  if (navigation.length) patch.navigation = navigation;

  if (Object.keys(contactRaw).length) {
    patch.contact = {
      email: text(contactRaw.email, 200) || undefined,
      phone: text(contactRaw.phone, 60) || undefined,
      address: text(contactRaw.address, 300) || undefined,
      bookingUrl: text(contactRaw.bookingUrl, 700) || undefined,
      hours: stringArray(contactRaw.hours, 14, 100),
    };
  }

  if (Object.keys(seoRaw).length) {
    const title = text(seoRaw.title, 160);
    const description = text(seoRaw.description, 320);
    if (title && description) patch.seo = { title, description, keywords: stringArray(seoRaw.keywords, 20, 80) };
  }

  patch.meta = {
    convertedFromDemo: true,
    demoProduct: text(state.productKey, 100) || undefined,
    convertedAt: new Date().toISOString(),
  };
  return patch;
}

async function materializeCommunityDemo(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  tenantId: string,
  state: Record<string, unknown>,
) {
  const community = object(state.community);
  if (!Object.keys(community).length) return;
  const groupNames = stringArray(community.groups, 8, 100);
  const communityName = text(community.name, 100);
  if (communityName && !groupNames.includes(communityName)) groupNames.unshift(communityName);

  for (const name of groupNames.slice(0, 8)) {
    const { data: existing } = await db.from('community_groups').select('id').eq('tenant_id', tenantId).eq('name', name).maybeSingle();
    if (!existing?.id) {
      await db.from('community_groups').insert({
        tenant_id: tenantId,
        name,
        description: text(community.description, 400) || 'Starter community group created from the Elevate sales sandbox.',
        category: 'launch',
        is_public: false,
        is_active: true,
      });
    }
  }

  const welcomePost = text(community.welcomePost, 4000);
  if (welcomePost) {
    await db.from('community_posts').insert({
      tenant_id: tenantId,
      user_id: null,
      content: welcomePost,
      tags: ['welcome', 'launch-foundation'],
      data: { source: 'demo-conversion', non_production_origin: true },
    });
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  const body = object(await request.json().catch(() => ({})));
  const demoToken = text(body.demoToken, 100);
  const organizationName = text(body.organizationName, 100);
  const ownerEmail = text(body.ownerEmail, 254).toLowerCase();
  const ownerName = text(body.ownerName, 100);
  const reference = `demo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  if (!demoToken || organizationName.length < 2 || ownerName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
    return NextResponse.json({ error: 'Demo token, organization name, owner name, and a valid email are required.' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const { data: demo, error: demoError } = await db.from('demo_sales_sessions').select('*').eq('session_token', demoToken).maybeSingle();
  if (demoError || !demo) return NextResponse.json({ error: 'Demo session not found.' }, { status: 404 });
  if (demo.converted_at) return NextResponse.json({ error: 'This demo was already converted.' }, { status: 409 });
  if (demo.expires_at && new Date(demo.expires_at) <= new Date()) {
    return NextResponse.json({ error: 'This demo session expired. Start a new demo to keep building.' }, { status: 410 });
  }

  const state = object(demo.state);
  const industry = text(state.industry, 100) || 'Business Services';
  const trial = await startWorkspaceTrial({ organizationName, ownerEmail, ownerName, industry });
  if (trial.ok === false) {
    return NextResponse.json({ error: trial.error }, { status: typeof trial.status === 'number' ? trial.status : 500 });
  }

  const access = await ensureTrialOwnerAccess({
    organizationId: trial.organizationId,
    tenantId: trial.tenantId,
    workspaceId: trial.workspaceId,
    ownerEmail,
    ownerName,
    builderUrl: '/apps/website-builder',
    websiteMode: 'new',
    reference,
    source: 'demo_conversion',
    db,
  });
  if (access.ok === false) {
    return NextResponse.json({
      error: `Demo workspace exists but onboarding could not complete at ${access.stage}. ${access.error}`,
      onboardingStage: access.stage,
      retryable: true,
      correlationId: reference,
    }, { status: 500 });
  }

  const { data: workspace } = await db.from('customer_workspaces').select('metadata').eq('id', trial.workspaceId).maybeSingle();
  const workspaceMetadata = object(workspace?.metadata);
  await db.from('customer_workspaces').update({
    metadata: {
      ...workspaceMetadata,
      converted_from_demo: true,
      demo_session_id: demo.id,
      demo_product: demo.product_key,
      demo_scenario: demo.scenario_key,
      demo_state: state,
      demo_converted_at: new Date().toISOString(),
      onboarding_complete: true,
      customer_ready_at: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  }).eq('id', trial.workspaceId);

  const { data: website } = await db.from('user_websites').select('id, site_config').eq('organization_id', trial.organizationId).maybeSingle();
  const sitePatch = sitePatchFromDemo({ ...state, productKey: demo.product_key });
  if (website?.id && website.site_config && sitePatch) {
    const merged = mergeSiteConfig(website.site_config as TenantSiteConfig, sitePatch);
    await db.from('user_websites').update({ site_config: merged, updated_at: new Date().toISOString() }).eq('id', website.id);
  }

  await materializeCommunityDemo(db, trial.tenantId, state);
  await db.from('demo_sales_sessions').update({
    converted_at: new Date().toISOString(),
    converted_tenant_id: trial.tenantId,
    converted_workspace_id: trial.workspaceId,
    last_activity_at: new Date().toISOString(),
  }).eq('id', demo.id);

  return NextResponse.json({
    ok: true,
    tenantId: trial.tenantId,
    workspaceId: trial.workspaceId,
    organizationId: trial.organizationId,
    dashboardUrl: access.builderUrl,
    builderUrl: access.builderUrl,
    loginUrl: access.loginUrl,
    publicPreviewUrl: trial.publicPreviewUrl,
    trialEndsAt: trial.trialEndsAt,
    keptDemoBuild: true,
    onboardingComplete: true,
    correlationId: reference,
  });
}
