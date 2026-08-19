import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiChat } from '@/lib/ai/ai-service';
import { hydrateProcessEnv } from '@/lib/secrets';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import { ensureComposableSiteConfig, sanitizePages } from '@/lib/tenant/site-composition';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { consumeWebsiteBuilderCredits } from '@/lib/apps/website-builder-trial';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

export async function POST(request: NextRequest) {
  await hydrateProcessEnv();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: subscription } = await supabase.from('user_app_subscriptions').select('plan, status, trial_ends_at').eq('user_id', user.id).eq('app_slug', 'website-builder').maybeSingle();
  if (!subscription || !['trial', 'active'].includes(subscription.status || '')) return NextResponse.json({ error: 'Website Builder subscription required' }, { status: 403 });
  if (subscription.status === 'trial' && subscription.trial_ends_at && new Date(subscription.trial_ends_at) < new Date()) return NextResponse.json({ error: 'Website Builder trial has expired', upgradeUrl: '/store/apps/website-builder' }, { status: 403 });

  const { data: ownedSites } = await supabase.from('user_websites').select('id, site_config, organization_id, subdomain').eq('user_id', user.id).order('updated_at', { ascending: false });
  const reusable = (ownedSites || []).find((site) => placeholder(site.site_config));
  const completedCount = (ownedSites || []).filter((site) => !placeholder(site.site_config)).length;
  const plan = subscription.plan || 'starter';
  const limit = PLAN_SITE_LIMITS[plan] ?? 1;
  if (!reusable && limit !== null && completedCount >= limit) return NextResponse.json({ error: `${plan} plan allows ${limit} website${limit === 1 ? '' : 's'}`, upgradeUrl: '/store/apps/website-builder' }, { status: 409 });

  const credit = await consumeWebsiteBuilderCredits(supabase, user.id, 'initial_site_generation');
  if (!credit.allowed) return NextResponse.json({ error: credit.error || 'Not enough Website Builder credits', creditsRemaining: credit.balance, upgradeUrl: credit.upgradeUrl || '/store/apps/website-builder' }, { status: 402 });

  const body = await request.json().catch(() => ({}));
  const businessName = safeString(body.businessName, 'My Business', 120);
  const industry = safeString(body.industry, 'Professional Services', 200);
  const services = safeString(body.services, '', 2500);
  const audience = safeString(body.audience, '', 1200);
  const style = safeString(body.style, 'professional, modern, trustworthy', 1000);
  const goal = safeString(body.goal, 'generate qualified leads', 1200);
  const contactEmail = safeString(body.contactEmail, user.email || '', 240);
  const extra = safeString(body.extra, '', 3000);

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
    const result = await aiChat({
      messages: [
        {
          role: 'system',
          content: `You are PARIS, the autonomous website architect inside Elevate Website Builder. Build a complete multi-page website from the business interview. Return ONLY valid JSON matching this shape:\n${JSON.stringify(responseShape, null, 2)}\n\nCreate the pages the business actually needs, not a fixed template. Usually include Home and Contact plus appropriate pages such as About, Services, Programs, Shop, Booking, FAQ, Gallery, Team, Pricing, or other pages when justified. Use only these section types: hero, rich_text, features, services, products, testimonial, stats, gallery, image, video, faq, team, pricing, cta, contact_form, booking. Each page should have 1-7 useful sections. Every contact page should include contact_form. A contact_form may use content.fields. Supported field types are text, email, tel, textarea, and select. Each field must contain name, label, type, and required; select fields may include options. Every custom lead form MUST include an email field named exactly "email" so the business can contact the lead. Only collect information reasonably needed for the user's stated business purpose; do not request passwords, Social Security numbers, payment-card data, health records, or other unnecessary sensitive data. Use internal links that match the generated page slugs. Do not invent addresses, licenses, accreditations, testimonials, ratings, outcomes, clients, staff members, prices, or legal claims unless supplied by the user. If information is unknown, omit it rather than fabricating it. The generated website must be useful, conversion-focused, responsive-friendly, and specific to the interview.`,
        },
        { role: 'user', content: `Business name: ${businessName}\nIndustry: ${industry}\nServices/programs: ${services}\nTarget customer: ${audience}\nPreferred style: ${style}\nPrimary website goal: ${goal}\nContact email: ${contactEmail}\nAdditional notes: ${extra}` },
      ],
      temperature: 0.4,
      maxTokens: 7000,
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
      meta: { ...(fallback.meta || {}), generatedBy: 'paris-autonomous-website-builder', parisInterviewCompleted: true, interview: { industry, services, audience, style, goal, extra }, generatedAt: new Date().toISOString() },
    });
  } catch {
    config = ensureComposableSiteConfig({ ...fallback, meta: { ...(fallback.meta || {}), parisInterviewCompleted: true, generationFallback: true, interview: { industry, services, audience, style, goal, extra } } });
  }

  const payload = { user_id: user.id, site_name: businessName, template_id: config.template.id, site_config: config, is_published: false, status: 'draft', updated_at: new Date().toISOString() };
  const query = reusable?.id
    ? supabase.from('user_websites').update(payload).eq('id', reusable.id).eq('user_id', user.id)
    : supabase.from('user_websites').insert({ ...payload, created_at: new Date().toISOString() });
  const { data: site, error } = await query.select('id, site_name, subdomain, is_published, updated_at').maybeSingle();

  if (error || !site) return NextResponse.json({ error: error?.message || 'Could not create AI website' }, { status: 500 });
  return NextResponse.json({ website: site, generated: true, editUrl: `/apps/website-builder/edit/${site.id}`, creditsCharged: credit.charged, creditsRemaining: credit.balance }, { status: reusable?.id ? 200 : 201 });
}
