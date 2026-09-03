import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAITask } from '@/lib/ai/orchestrator';
import { hydrateProcessEnv } from '@/lib/secrets';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import { ensureComposableSiteConfig, sanitizePages } from '@/lib/tenant/site-composition';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { validateSiteConfig } from '@/lib/tenant/site-validation';
import { consumeWebsiteBuilderCredits } from '@/lib/apps/website-builder-trial';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';
import { missingRequiredWebsiteAnswers, type WebsiteInterviewAnswers } from '@/lib/website-builder/interview';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const PLAN_SITE_LIMITS: Record<string, number | null> = { starter: 1, professional: 3, enterprise: null };

function safeString(value: unknown, fallback = '', max = 1600): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : fallback;
}

function cleanJson(content: string): any {
  return JSON.parse(content.replace(/```json?/gi, '').replace(/```/g, '').trim());
}

function placeholder(config: unknown) {
  const meta = config && typeof config === 'object' && (config as any).meta && typeof (config as any).meta === 'object' ? (config as any).meta : {};
  return meta.parisInterviewCompleted === false;
}

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  await hydrateProcessEnv();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const [subscriptionResult, sitesResult] = await Promise.all([
    supabase.from('user_app_subscriptions').select('plan, status, trial_ends_at').eq('user_id', user.id).eq('app_slug', 'website-builder').maybeSingle(),
    supabase.from('user_websites').select('id, site_config, organization_id, subdomain').eq('user_id', user.id).order('updated_at', { ascending: false }),
  ]);
  const subscription = subscriptionResult.data;
  const ownedSites = sitesResult.data;

  if (!subscription || !['trial', 'active'].includes(subscription.status || '')) return NextResponse.json({ error: 'Website Builder subscription required' }, { status: 403 });
  if (subscription.status === 'trial' && subscription.trial_ends_at && new Date(subscription.trial_ends_at) < new Date()) return NextResponse.json({ error: 'Website Builder trial has expired', upgradeUrl: '/store/apps/website-builder' }, { status: 403 });

  const reusable = (ownedSites || []).find((site) => placeholder(site.site_config));
  const completedCount = (ownedSites || []).filter((site) => !placeholder(site.site_config)).length;
  const plan = subscription.plan || 'starter';
  const limit = PLAN_SITE_LIMITS[plan] ?? 1;
  if (!reusable && limit !== null && completedCount >= limit) return NextResponse.json({ error: `${plan} plan allows ${limit} website${limit === 1 ? '' : 's'}`, upgradeUrl: '/store/apps/website-builder' }, { status: 409 });

  const body = await request.json().catch(() => ({}));
  const rawAnswers = body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers)
    ? body.answers as Record<string, unknown>
    : body as Record<string, unknown>;
  const answers: WebsiteInterviewAnswers = Object.fromEntries(
    Object.entries(rawAnswers).map(([key, value]) => [key, safeString(value, '', 3000)]),
  );
  const missing = missingRequiredWebsiteAnswers(answers);
  if (missing.length) {
    return NextResponse.json({ error: 'Complete the required PARIS interview questions before generation.', missing }, { status: 400 });
  }
  const businessName = safeString(answers.businessName, '', 120);
  const industry = safeString(answers.industry, '', 500);
  const contactEmail = safeString(user.email, '', 240);
  const structuredBrief = JSON.stringify(answers, null, 2).slice(0, 24000);

  const fallback = buildDefaultSiteConfig({ organizationName: businessName, industry, contactEmail: contactEmail || undefined });
  let config: TenantSiteConfig = fallback;

  const responseShape = {
    branding: { primaryColor: '#hex', secondaryColor: '#hex', accentColor: '#hex', backgroundColor: '#hex', textColor: '#hex', logoText: 'text', tagline: 'text' },
    pages: [{
      slug: '/', title: 'Home', navLabel: 'Home', showInNavigation: true,
      seo: { title: 'text', description: 'text', keywords: ['text'] },
      sections: [
        { type: 'hero', content: { eyebrow: 'text', title: 'text', text: 'text', buttonText: 'text', buttonHref: '/contact', image: '' }, settings: { align: 'left' } },
        { type: 'features', content: { title: 'text', items: [{ title: 'text', description: 'text' }] }, settings: {} },
        { type: 'contact_form', content: { title: 'Contact us', fields: [{ name: 'name', label: 'Name', type: 'text', required: true }, { name: 'email', label: 'Email', type: 'email', required: true }, { name: 'message', label: 'How can we help?', type: 'textarea', required: true }] }, settings: {} },
      ],
    }],
    seo: { title: 'text', description: 'text', keywords: ['text'] },
  };

  try {
    const result = await runAITask({
      task: 'general_chat',
      context: { userId: user.id, skipRAG: true },
      prompt: `You are PARIS, a senior website strategist and designer inside Elevate Website Builder. Build a polished, specific website from the verified business brief below. Return ONLY valid JSON matching this shape:\n${JSON.stringify(responseShape, null, 2)}\n\nStructured interview brief:\n${structuredBrief}\n\nThe result must look intentionally designed for this exact business, never like a generic SaaS template. Avoid generic phrases such as "welcome to", "quality service", "your trusted partner", "solutions for you", "we are committed to excellence", or filler statistics. Give the hero a distinctive point of view based on the supplied facts. Choose a coherent color system rather than default blue/purple gradients. Create only pages the business truly needs, normally 2-5 pages, and keep each page focused with 1-5 strong sections. Use only these section types: hero, rich_text, features, services, products, gallery, image, video, faq, team, cta, contact_form, booking. Do not generate testimonial, stats, pricing, accreditation, ratings, outcomes, customer counts, staff identities, addresses, licenses, or other material claims; those are inserted only from separately verified claim records. Every contact page should include contact_form. Supported field types are text, email, tel, textarea, and select. Every custom lead form MUST include an email field named exactly "email". Only collect information reasonably needed for the stated purpose. Never request passwords, Social Security numbers, payment-card data, health records, or unnecessary sensitive data. Use internal links matching generated slugs. If information is unknown, omit it. Make the experience conversion-focused, accessible, mobile-first, and visually distinctive.`,
      temperature: 0.5,
      maxTokens: 3500,
    });

    const generated = cleanJson(result.content);
    const pages = sanitizePages(generated.pages);
    config = ensureComposableSiteConfig({
      ...fallback,
      branding: { ...fallback.branding, ...(generated.branding || {}), logoText: safeString(generated.branding?.logoText, businessName, 160), tagline: safeString(generated.branding?.tagline, fallback.branding.tagline || '', 300) },
      pages: pages.length ? pages : fallback.pages,
      seo: {
        title: safeString(generated.seo?.title, fallback.seo?.title || businessName, 180),
        description: safeString(generated.seo?.description, fallback.seo?.description || '', 500),
        keywords: Array.isArray(generated.seo?.keywords) ? generated.seo.keywords.map((item: unknown) => safeString(item, '', 80)).filter(Boolean).slice(0, 20) : fallback.seo?.keywords,
      },
      meta: { ...(fallback.meta || {}), generatedBy: 'paris-autonomous-website-builder', parisInterviewCompleted: true, interview: answers, generatedAt: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('[website-builder] PARIS generation failed', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'PARIS could not generate a validated website draft. No credits were charged.', retryable: true },
      { status: 502 },
    );
  }

  const validation = validateSiteConfig(config);
  if (!validation.valid) {
    logger.warn('[website-builder] generated draft failed validation', { errors: validation.errors });
    return NextResponse.json(
      { error: 'PARIS generated a draft that failed website validation. No credits were charged.', validation, retryable: true },
      { status: 422 },
    );
  }

  const credit = await consumeWebsiteBuilderCredits(supabase, user.id, 'initial_site_generation');
  if (!credit.allowed) return NextResponse.json({ error: credit.error || 'Not enough Website Builder credits', creditsRemaining: credit.balance, upgradeUrl: credit.upgradeUrl || '/store/apps/website-builder' }, { status: 402 });

  const payload = { user_id: user.id, site_name: businessName, template_id: config.template.id, site_config: config, is_published: false, status: 'draft', updated_at: new Date().toISOString() };
  const query = reusable?.id
    ? supabase.from('user_websites').update(payload).eq('id', reusable.id).eq('user_id', user.id)
    : supabase.from('user_websites').insert({ ...payload, created_at: new Date().toISOString() });
  const { data: site, error } = await query.select('id, site_name, subdomain, is_published, updated_at').maybeSingle();

  if (error || !site) return NextResponse.json({ error: error?.message || 'Could not create AI website' }, { status: 500 });
  return NextResponse.json({ website: site, generated: true, editUrl: `/apps/website-builder/edit/${site.id}`, creditsCharged: credit.charged, creditsRemaining: credit.balance }, { status: reusable?.id ? 200 : 201 });
}

export const POST = withApiAudit('/api/apps/website-builder/ai-generate', _POST);
