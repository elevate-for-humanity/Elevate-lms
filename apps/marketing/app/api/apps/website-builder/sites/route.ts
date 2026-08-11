import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PLAN_SITE_LIMITS: Record<string, number | null> = {
  starter: 1,
  professional: 3,
  enterprise: null,
};

function stringValue(value: unknown, fallback = '', max = 1200) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : fallback;
}

function optionalString(value: unknown, max = 1200) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
}

function normalizeProvidedConfig(
  provided: unknown,
  fallback: TenantSiteConfig,
): TenantSiteConfig {
  if (!provided || typeof provided !== 'object' || Array.isArray(provided)) return fallback;
  const incoming = provided as Record<string, any>;

  const products = Array.isArray(incoming.products)
    ? incoming.products.slice(0, 60).map((item: any) => ({
        name: stringValue(item?.name, 'Product', 180),
        description: stringValue(item?.description, '', 1800),
        price: optionalString(item?.price, 40),
        compareAtPrice: optionalString(item?.compareAtPrice, 40),
        image: optionalString(item?.image, 1600),
        imageAlt: optionalString(item?.imageAlt, 220),
        href: optionalString(item?.href, 1600),
        category: optionalString(item?.category, 120),
        badge: optionalString(item?.badge, 80),
      }))
    : fallback.products;

  return {
    ...fallback,
    template:
      incoming.template && typeof incoming.template === 'object' && !Array.isArray(incoming.template)
        ? {
            ...fallback.template,
            ...incoming.template,
            id: stringValue(incoming.template.id, fallback.template.id, 80),
            name: stringValue(incoming.template.name, fallback.template.name, 120),
          }
        : fallback.template,
    branding: {
      ...fallback.branding,
      ...(incoming.branding && typeof incoming.branding === 'object' ? incoming.branding : {}),
      logoText: stringValue(incoming.branding?.logoText, fallback.branding.logoText, 120),
      tagline: stringValue(incoming.branding?.tagline, fallback.branding.tagline || '', 240),
      logoImage: optionalString(incoming.branding?.logoImage, 1600),
    },
    homepage: {
      ...fallback.homepage,
      ...(incoming.homepage && typeof incoming.homepage === 'object' ? incoming.homepage : {}),
      heroTitle: stringValue(incoming.homepage?.heroTitle, fallback.homepage.heroTitle, 180),
      heroSubtitle: stringValue(incoming.homepage?.heroSubtitle, fallback.homepage.heroSubtitle, 500),
      heroCtaText: stringValue(incoming.homepage?.heroCtaText, fallback.homepage.heroCtaText, 80),
      heroCtaHref: optionalString(incoming.homepage?.heroCtaHref, 600),
      heroImage: optionalString(incoming.homepage?.heroImage, 1600),
      heroImageAlt: optionalString(incoming.homepage?.heroImageAlt, 220),
      announcement: optionalString(incoming.homepage?.announcement, 240),
      features: Array.isArray(incoming.homepage?.features)
        ? incoming.homepage.features.slice(0, 12).map((item: any) => ({
            title: stringValue(item?.title, 'Service', 120),
            description: stringValue(item?.description, '', 500),
            image: optionalString(item?.image, 1600),
          }))
        : fallback.homepage.features,
    },
    programs: Array.isArray(incoming.programs)
      ? incoming.programs.slice(0, 30).map((item: any) => ({
          name: stringValue(item?.name, 'Service', 160),
          description: stringValue(item?.description, '', 1000),
          duration: stringValue(item?.duration, '', 80),
          level: stringValue(item?.level, '', 80),
          image: optionalString(item?.image, 1600),
        }))
      : fallback.programs,
    products,
    contact:
      incoming.contact && typeof incoming.contact === 'object' && !Array.isArray(incoming.contact)
        ? {
            email: optionalString(incoming.contact.email, 180),
            phone: optionalString(incoming.contact.phone, 80),
            address: optionalString(incoming.contact.address, 300),
            bookingUrl: optionalString(incoming.contact.bookingUrl, 1600),
            hours: Array.isArray(incoming.contact.hours)
              ? incoming.contact.hours.map((value: unknown) => stringValue(value, '', 120)).filter(Boolean).slice(0, 14)
              : undefined,
          }
        : fallback.contact,
    navigation: Array.isArray(incoming.navigation)
      ? incoming.navigation.slice(0, 16).map((item: any) => ({
          label: stringValue(item?.label, 'Page', 60),
          href: stringValue(item?.href, '/', 1600),
        }))
      : fallback.navigation,
    footer: {
      ...fallback.footer,
      ...(incoming.footer && typeof incoming.footer === 'object' ? incoming.footer : {}),
      description: stringValue(incoming.footer?.description, fallback.footer.description, 700),
      contactEmail: stringValue(incoming.footer?.contactEmail, fallback.footer.contactEmail || '', 180),
    },
    seo: incoming.seo && typeof incoming.seo === 'object'
      ? {
          title: stringValue(incoming.seo.title, fallback.seo?.title || fallback.branding.logoText, 180),
          description: stringValue(incoming.seo.description, fallback.seo?.description || '', 500),
          keywords: Array.isArray(incoming.seo.keywords)
            ? incoming.seo.keywords.map((keyword: unknown) => stringValue(keyword, '', 80)).filter(Boolean).slice(0, 30)
            : fallback.seo?.keywords,
        }
      : fallback.seo,
    meta: incoming.meta && typeof incoming.meta === 'object' && !Array.isArray(incoming.meta)
      ? { ...(fallback.meta || {}), ...incoming.meta }
      : fallback.meta,
  };
}

async function getAdminRole(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  return data?.role === 'admin' || data?.role === 'super_admin';
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const adminTesting = await getAdminRole(user.id);
  const { data: subscription } = await supabase
    .from('user_app_subscriptions')
    .select('plan, status, trial_ends_at')
    .eq('user_id', user.id)
    .eq('app_slug', 'website-builder')
    .maybeSingle();

  if (!adminTesting && (!subscription || !['trial', 'active'].includes(subscription.status || ''))) {
    return NextResponse.json({ error: 'Website Builder subscription required' }, { status: 403 });
  }

  if (!adminTesting && subscription?.status === 'trial' && subscription.trial_ends_at && new Date(subscription.trial_ends_at) < new Date()) {
    return NextResponse.json({ error: 'Website Builder trial has expired' }, { status: 403 });
  }

  const plan = adminTesting ? 'enterprise' : (subscription?.plan || 'starter');
  const limit = PLAN_SITE_LIMITS[plan] ?? 1;
  if (limit !== null) {
    const { count } = await supabase
      .from('user_websites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if ((count || 0) >= limit) {
      return NextResponse.json(
        {
          error: `${plan} plan allows ${limit} website${limit === 1 ? '' : 's'}`,
          upgradeUrl: '/store/apps/website-builder',
        },
        { status: 409 },
      );
    }
  }

  const body = await request.json().catch(() => ({}));
  const siteName = typeof body.siteName === 'string' && body.siteName.trim()
    ? body.siteName.trim().slice(0, 120)
    : 'My Website';
  const fallback = buildDefaultSiteConfig({ organizationName: siteName, contactEmail: user.email || undefined });
  const config = normalizeProvidedConfig(body.siteConfig, fallback);

  const { data: site, error } = await supabase
    .from('user_websites')
    .insert({
      user_id: user.id,
      site_name: siteName,
      template_id: config.template.id,
      site_config: config,
      is_published: false,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, site_name, subdomain, is_published, updated_at')
    .maybeSingle();

  if (error || !site) {
    return NextResponse.json({ error: error?.message || 'Could not create website' }, { status: 500 });
  }

  return NextResponse.json({ website: site }, { status: 201 });
}
