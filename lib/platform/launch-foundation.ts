import 'server-only';

import { aiChat } from '@/lib/ai/ai-service';
import { requireAdminClient } from '@/lib/supabase/admin';
import { buildDefaultSiteConfig, mergeSiteConfig } from '@/lib/tenant/default-site-config';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';

export interface LaunchFoundationInput {
  tenantId: string;
  userId: string;
  organizationId?: string | null;
  businessName: string;
  industry: string;
  audience: string;
  offer: string;
  transformation: string;
  style?: string;
}

export interface LaunchFoundation {
  positioning: {
    headline: string;
    subheadline: string;
    audience: string;
    promise: string;
  };
  website: {
    heroTitle: string;
    heroSubtitle: string;
    cta: string;
    services: Array<{ title: string; description: string }>;
  };
  community: {
    name: string;
    description: string;
    welcomePost: string;
    groups: string[];
    starterDiscussions: string[];
  };
  course: {
    title: string;
    description: string;
    modules: Array<{ title: string; lessons: string[] }>;
  };
  offer: {
    name: string;
    description: string;
    suggestedMonthlyPrice: number;
  };
  launchKit: {
    leadMagnetTitle: string;
    salesPageHeadline: string;
    emailSubjects: string[];
    socialPosts: string[];
    thirtyDayPlan: string[];
  };
  agents: Array<{ name: string; role: string; purpose: string }>;
}

function cleanJson(text: string): string {
  return text.replace(/```json/gi, '').replace(/```/g, '').trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `launch-${Date.now()}`;
}

function clampPrice(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 29;
  return Math.min(Math.max(Math.round(amount), 0), 5000);
}

function normalizeFoundation(raw: unknown, input: LaunchFoundationInput): LaunchFoundation {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? raw as Record<string, any>
    : {};
  const positioning = source.positioning ?? {};
  const website = source.website ?? {};
  const community = source.community ?? {};
  const course = source.course ?? {};
  const offer = source.offer ?? {};
  const launchKit = source.launchKit ?? {};

  const list = (value: unknown, max: number) => Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, max)
    : [];

  const services = Array.isArray(website.services)
    ? website.services.slice(0, 6).map((service: any) => ({
        title: String(service?.title ?? '').trim().slice(0, 100),
        description: String(service?.description ?? '').trim().slice(0, 320),
      })).filter((service: any) => service.title)
    : [];

  const modules = Array.isArray(course.modules)
    ? course.modules.slice(0, 8).map((module: any) => ({
        title: String(module?.title ?? '').trim().slice(0, 120),
        lessons: list(module?.lessons, 12),
      })).filter((module: any) => module.title)
    : [];

  const agents = Array.isArray(source.agents)
    ? source.agents.slice(0, 8).map((agent: any) => ({
        name: String(agent?.name ?? '').trim().slice(0, 80),
        role: String(agent?.role ?? '').trim().slice(0, 120),
        purpose: String(agent?.purpose ?? '').trim().slice(0, 280),
      })).filter((agent: any) => agent.name)
    : [];

  return {
    positioning: {
      headline: String(positioning.headline ?? input.businessName).trim().slice(0, 160),
      subheadline: String(positioning.subheadline ?? input.transformation).trim().slice(0, 320),
      audience: String(positioning.audience ?? input.audience).trim().slice(0, 200),
      promise: String(positioning.promise ?? input.transformation).trim().slice(0, 300),
    },
    website: {
      heroTitle: String(website.heroTitle ?? positioning.headline ?? input.businessName).trim().slice(0, 160),
      heroSubtitle: String(website.heroSubtitle ?? positioning.subheadline ?? input.transformation).trim().slice(0, 360),
      cta: String(website.cta ?? 'Get Started').trim().slice(0, 60),
      services: services.length ? services : [{ title: input.offer, description: input.transformation }],
    },
    community: {
      name: String(community.name ?? `${input.businessName} Community`).trim().slice(0, 120),
      description: String(community.description ?? `A community for ${input.audience}.`).trim().slice(0, 500),
      welcomePost: String(community.welcomePost ?? `Welcome to ${input.businessName}.`).trim().slice(0, 4000),
      groups: list(community.groups, 8),
      starterDiscussions: list(community.starterDiscussions, 12),
    },
    course: {
      title: String(course.title ?? `${input.offer} Foundations`).trim().slice(0, 160),
      description: String(course.description ?? input.transformation).trim().slice(0, 600),
      modules,
    },
    offer: {
      name: String(offer.name ?? input.offer).trim().slice(0, 160),
      description: String(offer.description ?? input.transformation).trim().slice(0, 600),
      suggestedMonthlyPrice: clampPrice(offer.suggestedMonthlyPrice),
    },
    launchKit: {
      leadMagnetTitle: String(launchKit.leadMagnetTitle ?? `${input.offer} Starter Guide`).trim().slice(0, 180),
      salesPageHeadline: String(launchKit.salesPageHeadline ?? positioning.headline ?? input.businessName).trim().slice(0, 180),
      emailSubjects: list(launchKit.emailSubjects, 10),
      socialPosts: list(launchKit.socialPosts, 12),
      thirtyDayPlan: list(launchKit.thirtyDayPlan, 30),
    },
    agents,
  };
}

async function resolveOrganizationId(userId: string, explicit?: string | null): Promise<string | null> {
  if (explicit) return explicit;
  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .maybeSingle();
  return profile?.organization_id ?? null;
}

export async function createLaunchFoundation(input: LaunchFoundationInput) {
  const db = await requireAdminClient();
  const organizationId = await resolveOrganizationId(input.userId, input.organizationId);

  const result = await aiChat({
    temperature: 0.35,
    maxTokens: 5000,
    messages: [
      {
        role: 'system',
        content: `You are the Elevate Launch Architect. Create a launch foundation for a business, training provider, membership organization, school, workforce organization, consultant, nonprofit, salon, shop, agency, or creator business. Return JSON only. Never invent licenses, accreditation, government approvals, funding eligibility, testimonials, earnings, outcomes, addresses, or legal status. Keep all claims commercial but verifiable. Required structure: {"positioning":{"headline":"","subheadline":"","audience":"","promise":""},"website":{"heroTitle":"","heroSubtitle":"","cta":"","services":[{"title":"","description":""}]},"community":{"name":"","description":"","welcomePost":"","groups":[],"starterDiscussions":[]},"course":{"title":"","description":"","modules":[{"title":"","lessons":[]}]},"offer":{"name":"","description":"","suggestedMonthlyPrice":0},"launchKit":{"leadMagnetTitle":"","salesPageHeadline":"","emailSubjects":[],"socialPosts":[],"thirtyDayPlan":[]},"agents":[{"name":"PARIS","role":"onboarding and growth","purpose":""},{"name":"ELLIE","role":"learning and member support","purpose":""},{"name":"LIZZY","role":"operations and engagement","purpose":""},{"name":"ZORA","role":"governance and compliance","purpose":""}]}`,
      },
      {
        role: 'user',
        content: `Business: ${input.businessName}\nIndustry: ${input.industry}\nAudience: ${input.audience}\nOffer: ${input.offer}\nTransformation: ${input.transformation}\nStyle: ${input.style ?? 'professional'}`,
      },
    ],
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJson(result.content));
  } catch {
    throw new Error('Launch Architect returned invalid JSON.');
  }
  const foundation = normalizeFoundation(parsed, input);

  const fallback = buildDefaultSiteConfig({
    organizationName: input.businessName,
    industry: input.industry,
  });
  const siteConfig: TenantSiteConfig = mergeSiteConfig(fallback, {
    branding: {
      logoText: input.businessName,
      tagline: foundation.positioning.promise,
    },
    homepage: {
      heroTitle: foundation.website.heroTitle,
      heroSubtitle: foundation.website.heroSubtitle,
      heroCtaText: foundation.website.cta,
      features: foundation.website.services,
    },
    seo: {
      title: `${input.businessName} | ${foundation.positioning.headline}`.slice(0, 160),
      description: foundation.positioning.subheadline.slice(0, 320),
      keywords: [input.businessName, input.industry, input.offer, input.audience].filter(Boolean),
    },
    meta: {
      launchFoundation: foundation,
      generatedBy: 'elevate-launch-foundation',
      generatedAt: new Date().toISOString(),
    },
  });

  const { data: existingSite } = organizationId
    ? await db.from('user_websites').select('id').eq('organization_id', organizationId).maybeSingle()
    : { data: null };

  let websiteId = existingSite?.id ?? null;
  if (websiteId) {
    const { error } = await db.from('user_websites').update({
      site_name: input.businessName,
      site_config: siteConfig,
      status: 'active',
      updated_at: new Date().toISOString(),
    }).eq('id', websiteId);
    if (error) throw error;
  } else {
    const { data: site, error } = await db.from('user_websites').insert({
      user_id: input.userId,
      organization_id: organizationId,
      site_name: input.businessName,
      subdomain: `${slugify(input.businessName)}-${Date.now().toString().slice(-4)}`,
      site_config: siteConfig,
      is_published: false,
      status: 'active',
    }).select('id').single();
    if (error) throw error;
    websiteId = site.id;
  }

  const groupRows = [foundation.community.name, ...foundation.community.groups]
    .filter(Boolean)
    .filter((name, index, array) => array.indexOf(name) === index)
    .slice(0, 8)
    .map((name) => ({
      tenant_id: input.tenantId,
      created_by: input.userId,
      name,
      description: foundation.community.description,
      category: 'launch',
      is_public: false,
      is_active: true,
      access_level: 'free',
    }));
  if (groupRows.length) {
    for (const row of groupRows) {
      const { data: existingGroup } = await db
        .from('community_groups')
        .select('id')
        .eq('tenant_id', input.tenantId)
        .eq('name', row.name)
        .maybeSingle();
      if (!existingGroup?.id) await db.from('community_groups').insert(row);
    }
  }

  if (foundation.community.welcomePost) {
    await db.from('community_posts').insert({
      tenant_id: input.tenantId,
      user_id: input.userId,
      content: foundation.community.welcomePost,
      tags: ['welcome', 'launch'],
      access_level: 'free',
      data: { source: 'launch-foundation' },
    });
  }

  // The Launch Architect may propose a course outline, but it must not author a
  // canonical course. Studio -> Course Builder is the only application authoring
  // authority, so the generated outline stays in the launch foundation until the
  // authenticated owner chooses to build it there.
  const courseId: string | null = null;
  const courseBuilderDeferred = Boolean(foundation.course.title);

  const suggestedPriceCents = foundation.offer.suggestedMonthlyPrice * 100;
  let offerId: string | null = null;
  if (suggestedPriceCents >= 50) {
    const { data: tenantOffer } = await db.from('tenant_offers').insert({
      tenant_id: input.tenantId,
      organization_id: organizationId,
      name: foundation.offer.name,
      description: foundation.offer.description,
      public_slug: `${slugify(foundation.offer.name)}-${Date.now().toString().slice(-5)}`,
      pricing_type: 'subscription',
      amount_cents: suggestedPriceCents,
      currency: 'usd',
      billing_interval: 'month',
      active: false,
      access_config: {
        launch_foundation: true,
        community: Boolean(foundation.community.name),
        course_id: null,
        course_builder_deferred: courseBuilderDeferred,
      },
      created_by: input.userId,
    }).select('id').maybeSingle();
    offerId = tenantOffer?.id ?? null;
  }

  const { data: launchRecord, error: launchError } = await db.from('launch_foundations').insert({
    tenant_id: input.tenantId,
    organization_id: organizationId,
    user_id: input.userId,
    website_id: websiteId,
    input: {
      businessName: input.businessName,
      industry: input.industry,
      audience: input.audience,
      offer: input.offer,
      transformation: input.transformation,
      style: input.style ?? 'professional',
    },
    foundation,
    status: 'materialized',
    model_provider: result.provider,
  }).select('id').single();
  if (launchError) throw launchError;

  return {
    foundation,
    launchFoundationId: launchRecord.id,
    websiteId,
    courseId,
    courseBuilderDeferred,
    courseBuilderUrl: courseBuilderDeferred ? '/studio/courses' : null,
    offerId,
    provider: result.provider,
  };
}
