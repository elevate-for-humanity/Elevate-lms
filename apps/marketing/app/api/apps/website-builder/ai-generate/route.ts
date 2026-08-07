import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiChat } from '@/lib/ai/ai-service';
import { hydrateProcessEnv } from '@/lib/secrets';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PLAN_SITE_LIMITS: Record<string, number | null> = {
  starter: 1,
  professional: 3,
  enterprise: null,
};

function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim().slice(0, 1200) : fallback;
}

function cleanJson(content: string): any {
  const cleaned = content.replace(/```json?/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

export async function POST(request: NextRequest) {
  await hydrateProcessEnv();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: subscription } = await supabase
    .from('user_app_subscriptions')
    .select('plan, status, trial_ends_at')
    .eq('user_id', user.id)
    .eq('app_slug', 'website-builder')
    .maybeSingle();

  if (!subscription || !['trial', 'active'].includes(subscription.status || '')) {
    return NextResponse.json({ error: 'Website Builder subscription required' }, { status: 403 });
  }
  if (subscription.status === 'trial' && subscription.trial_ends_at && new Date(subscription.trial_ends_at) < new Date()) {
    return NextResponse.json({ error: 'Website Builder trial has expired' }, { status: 403 });
  }

  const plan = subscription.plan || 'starter';
  const limit = PLAN_SITE_LIMITS[plan] ?? 1;
  if (limit !== null) {
    const { count } = await supabase.from('user_websites').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
    if ((count || 0) >= limit) {
      return NextResponse.json({
        error: `${plan} plan allows ${limit} website${limit === 1 ? '' : 's'}`,
        upgradeUrl: '/store/apps/website-builder',
      }, { status: 409 });
    }
  }

  const body = await request.json().catch(() => ({}));
  const businessName = safeString(body.businessName, 'My Business');
  const industry = safeString(body.industry, 'Professional Services');
  const services = safeString(body.services);
  const audience = safeString(body.audience);
  const style = safeString(body.style, 'professional, modern, trustworthy');
  const goal = safeString(body.goal, 'generate qualified leads');
  const contactEmail = safeString(body.contactEmail, user.email || '');
  const extra = safeString(body.extra);

  const fallback = buildDefaultSiteConfig({ organizationName: businessName, industry, contactEmail: contactEmail || undefined });
  let config: TenantSiteConfig = fallback;

  try {
    const result = await aiChat({
      messages: [
        {
          role: 'system',
          content: `You are PARIS, an AI website strategist inside Elevate Website Builder. Build a concise, conversion-focused website configuration from the business interview. Return ONLY valid JSON with this exact shape:\n{\n  \"branding\": {\"primaryColor\":\"#hex\",\"secondaryColor\":\"#hex\",\"accentColor\":\"#hex\",\"logoText\":\"text\",\"tagline\":\"text\"},\n  \"homepage\": {\"heroTitle\":\"text\",\"heroSubtitle\":\"text\",\"heroCtaText\":\"text\",\"features\":[{\"title\":\"text\",\"description\":\"text\"}]},\n  \"programs\":[{\"name\":\"text\",\"description\":\"text\"}],\n  \"seo\": {\"title\":\"text\",\"description\":\"text\",\"keywords\":[\"text\"]}\n}. Use 3-5 homepage features. Programs may represent services if this is not a school. Do not invent addresses, licenses, accreditations, testimonials, ratings, outcomes or legal claims.`,
        },
        {
          role: 'user',
          content: `Business name: ${businessName}\nIndustry: ${industry}\nServices/programs: ${services}\nTarget customer: ${audience}\nPreferred style: ${style}\nPrimary website goal: ${goal}\nContact email: ${contactEmail}\nAdditional notes: ${extra}`,
        },
      ],
      temperature: 0.45,
      maxTokens: 2200,
    });

    const generated = cleanJson(result.content);
    config = {
      ...fallback,
      branding: {
        ...fallback.branding,
        ...(generated.branding || {}),
        logoText: safeString(generated.branding?.logoText, businessName),
        tagline: safeString(generated.branding?.tagline, fallback.branding.tagline || ''),
      },
      homepage: {
        ...fallback.homepage,
        ...(generated.homepage || {}),
        heroTitle: safeString(generated.homepage?.heroTitle, fallback.homepage.heroTitle),
        heroSubtitle: safeString(generated.homepage?.heroSubtitle, fallback.homepage.heroSubtitle),
        heroCtaText: safeString(generated.homepage?.heroCtaText, fallback.homepage.heroCtaText),
        features: Array.isArray(generated.homepage?.features)
          ? generated.homepage.features.slice(0, 6).map((item: any) => ({
              title: safeString(item?.title, 'Service'),
              description: safeString(item?.description, ''),
            }))
          : fallback.homepage.features,
      },
      programs: Array.isArray(generated.programs)
        ? generated.programs.slice(0, 12).map((item: any) => ({
            name: safeString(item?.name, 'Service'),
            description: safeString(item?.description, ''),
          }))
        : fallback.programs,
      seo: {
        title: safeString(generated.seo?.title, fallback.seo?.title || businessName),
        description: safeString(generated.seo?.description, fallback.seo?.description || ''),
        keywords: Array.isArray(generated.seo?.keywords)
          ? generated.seo.keywords.map((keyword: unknown) => safeString(keyword)).filter(Boolean).slice(0, 20)
          : fallback.seo?.keywords,
      },
      meta: {
        ...(fallback.meta || {}),
        generatedBy: 'paris-website-builder',
        interview: { industry, services, audience, style, goal },
      },
    };
  } catch {
    // Fallback still creates a usable website if AI is temporarily unavailable.
    config = fallback;
  }

  const { data: site, error } = await supabase
    .from('user_websites')
    .insert({
      user_id: user.id,
      site_name: businessName,
      template_id: config.template.id,
      site_config: config,
      is_published: false,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, site_name, subdomain, is_published, updated_at')
    .maybeSingle();

  if (error || !site) return NextResponse.json({ error: error?.message || 'Could not create AI website' }, { status: 500 });

  return NextResponse.json({ website: site, generated: true, editUrl: `/apps/website-builder/edit/${site.id}` }, { status: 201 });
}
