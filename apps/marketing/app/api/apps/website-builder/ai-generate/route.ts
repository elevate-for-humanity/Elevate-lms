import { validateFooterContactFields } from '@/lib/tenant/footer-contact';
import { requireAdminClient } from '@/lib/supabase/admin';
import { commitWebsiteDraft } from '@/lib/apps/website-builder-draft-commit';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAITask } from '@/lib/ai/orchestrator';
import { hydrateProcessEnv } from '@/lib/secrets';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import { ensureComposableSiteConfig, sanitizePages } from '@/lib/tenant/site-composition';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { validateSiteConfig, validateHeroBackdropFields } from '@/lib/tenant/site-validation';
import { consumeWebsiteBuilderCredits } from '@/lib/apps/website-builder-trial';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';
import { missingRequiredWebsiteAnswers, type WebsiteInterviewAnswers } from '@/lib/website-builder/interview';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';
import { applyWebsiteDesign, interviewWebsiteDesign, readWebsiteDesign, websiteCatalog } from '@/lib/website-builder/design-choices';
import { buildLicensedAssetProjectPolicy } from '@/lib/media/licensed-asset-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

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

  const [access, sitesResult] = await Promise.all([
    getWebsiteBuilderAccess(user.id, supabase),
    supabase.from('user_websites').select('id, site_config, organization_id, subdomain, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }),
  ]);
  if (sitesResult.error) return NextResponse.json({ error: 'Could not load your existing websites. No new website was created.' }, { status: 503 });
  const ownedSites = sitesResult.data;

  if (!access.allowed) {
    return NextResponse.json(
      {
        error: 'Website Builder subscription or active trial required',
        reason: access.reason,
        upgradeUrl: access.upgradeUrl || '/store/apps/website-builder',
      },
      { status: 403 },
    );
  }

  const reusable = (ownedSites || []).find((site) => placeholder(site.site_config));
  const completedCount = (ownedSites || []).filter((site) => !placeholder(site.site_config)).length;
  const plan = access.plan || 'starter';
  const limit = Object.hasOwn(PLAN_SITE_LIMITS, plan) ? PLAN_SITE_LIMITS[plan] : 1;
  if (!reusable && limit !== null && completedCount >= limit) return NextResponse.json({ error: `${plan} plan allows ${limit} website${limit === 1 ? '' : 's'}`, upgradeUrl: '/store/apps/website-builder' }, { status: 409 });

  const body = await request.json().catch(() => ({}));
  const rawAnswers = body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers)
    ? body.answers as Record<string, unknown>
    : body as Record<string, unknown>;
  const answers: WebsiteInterviewAnswers = Object.fromEntries(
    Object.entries(rawAnswers).map(([key, value]) => [key, safeString(value, '', 3000)]),
  );
  const briefMode = typeof body.brief === 'string';
  const allowedDesigns = ['executive', 'modern', 'creative', 'minimal', 'retail', 'botanical'] as const;
  const designDirection = typeof body.designDirection === 'string' && allowedDesigns.some(item => item === body.designDirection) ? body.designDirection : null;
  if (briefMode) {
    const brief = safeString(body.brief, '', 12000);
    const name = safeString(body.businessName, '', 120);
    if (!name || brief.length < 40 || body.brief.length > 12000) {
      return NextResponse.json({ error: 'Provide a business name and a description between 40 and 12,000 characters.' }, { status: 400 });
    }
    // A single customer-authored brief is an alternative input, not invented interview answers.
    for (const key of Object.keys(answers)) delete answers[key];
    answers.businessName = name;
    answers.siteOwnerType = 'business';
    answers.brief = brief;
  }
  const designPreferences = body.designPreferences ? readWebsiteDesign(body.designPreferences) : briefMode ? readWebsiteDesign({ template: designDirection }) : interviewWebsiteDesign(answers);
  const missing = briefMode ? [] : missingRequiredWebsiteAnswers(answers);
  if (missing.length) {
    return NextResponse.json({ error: 'Complete the required PARIS interview questions before generation.', missing }, { status: 400 });
  }
  const businessName = safeString(answers.businessName, '', 120);
  const siteOwnerType = answers.siteOwnerType === 'individual' ? 'individual' : 'business or organization';
  const industry = safeString(answers.industry, '', 500);
  const contactEmail = safeString(user.email, '', 240);
  const structuredBrief = JSON.stringify({ websiteFor: siteOwnerType, ...answers, designPreferences, ...(designDirection ? { designDirection } : {}) }, null, 2).slice(0, 24000);

  const fallback = buildDefaultSiteConfig({ organizationName: businessName, industry, contactEmail: contactEmail || undefined });
  let config: TenantSiteConfig = fallback;

  const responseShape = {
    navigationGroups: [{ label: 'Explore', pageIds: ['home'] }],
    footer: { showContactDetails: false, linkGroups: [{ label: 'Company', pageIds: ['home'] }] },
    branding: { primaryColor: '#hex', secondaryColor: '#hex', accentColor: '#hex', backgroundColor: '#hex', textColor: '#hex', logoText: 'text', tagline: 'text' },
    pages: [{
      id: 'home', slug: '/', title: 'Home', navLabel: 'Home', showInNavigation: true,
      seo: { title: 'text', description: 'text', keywords: ['text'] },
      sections: [
        { type: 'hero', content: { eyebrow: 'text', title: 'text', text: 'text', buttonText: 'text', buttonHref: '/contact', image: '', introductionTitle: '', backdropImage: '' }, settings: { align: 'left', introductionPlacement: 'in-hero', backdropPosition: 'full', backdropOpacity: 12 } },
        { type: 'rich_text', content: { eyebrow: 'text', title: 'text', text: 'text', image: '', imageAlt: '', imageBrief: 'Customer-specific editorial image brief', buttonText: 'text', buttonHref: '/contact' }, settings: { layout: 'split', imagePosition: 'right' } },
        { type: 'cta', content: { title: 'Choose the support that fits', text: 'Customer-specific question and guidance', choicesLabel: 'Choose your priority', items: [{ label: 'Customer need', description: 'Relevant explanation', href: '/contact', buttonText: 'Explore this option' }], buttonText: 'Contact us', buttonHref: '/contact' }, settings: { layout: 'choices' } },
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
      prompt: `You are PARIS, a senior website strategist and designer inside Elevate Website Builder. Build a polished, specific website from the verified business brief below. Return ONLY valid JSON matching this shape:\n${JSON.stringify(responseShape, null, 2)}\n\nStructured interview brief:\n${structuredBrief}\n\nThe result must look intentionally designed for this exact business, never like a generic SaaS template. Avoid generic phrases such as "welcome to", "quality service", "your trusted partner", "solutions for you", "we are committed to excellence", or filler statistics. Give the hero a distinctive point of view based on the supplied facts. Choose a coherent color system rather than default blue/purple gradients. Create all pages the business truly needs, normally 4-8 complete pages, with 3-7 meaningful sections per page (home normally 6-9). Never create empty interior pages. Every page must have an intentional hero, relevant substantive content, and a contextual next-step CTA. Use at least three distinct visual compositions across the site: split photographic hero, editorial story, and service or feature grid. For editorial story and split image CTA sections use rich_text or cta with settings.layout="split", settings.imagePosition="left" or "right", and content.image/imageAlt/imageBrief/title/text/buttonText/buttonHref. For authentic founder or product portraits that must remain uncropped, hero settings may use imageFit="contain", imageFrame="plain" and mobileOrder="copy-first". Use mobileOrder="image-first" only when intentionally requested. For a guided priority selector use a cta section with settings.layout="choices", content.choicesLabel and content.items containing label, description, href and buttonText for each choice (at most 12). The selected choice displays its own explanation and link; selecting does not submit or navigate. Use only customer-specific needs and real generated page slugs, never invented services. An empty items array provides a conversational CTA without choices. For a supplied approved decorative hero background, set hero content.backdropImage to its unchanged local path or HTTPS image URL, and settings.backdropPosition to full, left or right with backdropOpacity from 0 to 100 (default 12). This decorative layer sits behind text and the foreground portrait, has empty alt text and never replaces content.image or narration. Omit it unless the customer supplies an approved graphic; never invent a flag, logo, identity or asset URL. These are shared renderer capabilities available to every subscriber. Set footer.showContactDetails=true only when the business requests a footer contact column; it displays only saved contact.email, contact.phone, contact.address and contact.hours. Never invent contact information, hours or destinations. Omit it or use false to retain the existing footer. For grouped navigation use optional navigationGroups and footer.linkGroups, each an array of {label, pageIds}. pageIds must reference stable IDs of the generated saved pages in display order, including an overview page when appropriate. Use at most eight groups per location. Never put external URLs, auth, checkout, booking or non-existent support destinations into pageIds. Omit groups to retain the default flat navigation. For a supplied, approved recorded introduction, include hero content.narration (the matching transcript), content.audioUrl (the supplied HTTPS or local audio URL), and optional content.musicUrl. Never invent media URLs or a transcript that differs from the supplied recording. Recorded introductions support visitor-controlled pause/resume/replay and optional background music. To place the introduction in a separate light band above its hero, set hero settings.introductionPlacement="before-hero" and supply content.introductionTitle. Omit this setting or use "in-hero" to retain inline placement. The band only appears when the customer supplies a narration transcript. Never invent a recording to fill the band. Without a supplied recording retain narration for the existing natural-voice path. Keep any supplied image URLs unchanged; an imageBrief is not a resolved image. Use premium photographic art direction: choose visual concepts specific to the customer's industry, with consistent lighting, composition, crop, color harmony, and image focal points. Prefer authentic, licensed customer assets and preserve the real logo and founder photos. Where assets are not supplied, do not fabricate image URLs or identities; instead include descriptive imageBrief fields in image-bearing section content so a separate licensed-asset selection or image-generation stage can fulfill them. Image briefs must describe subject, framing, mood, palette, orientation, and alt-text intent. Never represent an AI-generated portrait as a real person. Avoid generic stock imagery, distorted logos, and mismatched aspect ratios. Do not mark the website as visually complete until real image URLs are resolved and checked. Preserve the customer's existing brand assets when supplied. Avoid invented numerical outcomes, statistics, testimonials, and claims. Honor designPreferences exactly for template, layout, product density, image direction and narrator. Retail sites must include a complete product collection with verified prices, product-detail destinations, clear order instructions and an editable customer-care section. Do not invent discounts, inventory, payment connections, delivery promises or customer reviews. The result must feel like a premium custom-designed multi-page site, not a starter template. Use only these section types: hero, rich_text, features, services, products, gallery, image, video, faq, team, cta, contact_form, booking. Do not generate testimonial, stats, pricing, accreditation, ratings, outcomes, customer counts, staff identities, addresses, licenses, or other material claims; those are inserted only from separately verified claim records. Every contact page should include contact_form. Supported field types are text, email, tel, textarea, and select. Every custom lead form MUST include an email field named exactly "email". Only collect information reasonably needed for the stated purpose. Never request passwords, Social Security numbers, payment-card data, health records, or unnecessary sensitive data. Use internal links matching generated slugs. If information is unknown, omit it. Make the experience conversion-focused, accessible, mobile-first, and visually distinctive.`,
      temperature: 0.5,
      maxTokens: 10000,
    });

    const generated = cleanJson(result.content);
    const backdropErrors = [...validateHeroBackdropFields(generated), ...validateFooterContactFields(generated)];
    if (backdropErrors.length) return NextResponse.json({ error: 'Invalid website presentation configuration.', validation: { valid: false, errors: backdropErrors } }, { status: 422 });
    const pages = sanitizePages(generated.pages);
    config = ensureComposableSiteConfig({
      ...fallback,
      branding: { ...fallback.branding, ...(generated.branding || {}), logoText: safeString(generated.branding?.logoText, businessName, 160), tagline: safeString(generated.branding?.tagline, fallback.branding.tagline || '', 300) },
      pages: pages.length ? pages : fallback.pages,
      navigationGroups: generated.navigationGroups,
      footer: { ...fallback.footer, showContactDetails: generated.footer?.showContactDetails, linkGroups: generated.footer?.linkGroups },
      seo: {
        title: safeString(generated.seo?.title, fallback.seo?.title || businessName, 180),
        description: safeString(generated.seo?.description, fallback.seo?.description || '', 500),
        keywords: Array.isArray(generated.seo?.keywords) ? generated.seo.keywords.map((item: unknown) => safeString(item, '', 80)).filter(Boolean).slice(0, 20) : fallback.seo?.keywords,
      },
      meta: { ...(fallback.meta || {}), ...(designDirection ? { designDirection } : {}), generatedBy: 'paris-autonomous-website-builder', parisInterviewCompleted: true, interview: answers, generatedAt: new Date().toISOString(), licensedAssetPolicy: buildLicensedAssetProjectPolicy({ consumer: 'website_builder', plan }) },
    });
  } catch (error) {
    logger.error('[website-builder] PARIS generation failed', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'PARIS could not generate a validated website draft. No credits were charged.', retryable: true },
      { status: 502 },
    );
  }

  config = applyWebsiteDesign(config, designPreferences);
  config.products = websiteCatalog(config);
  const validation = validateSiteConfig(config);
  if (!validation.valid) {
    logger.warn('[website-builder] generated draft failed validation', { errors: validation.errors });
    return NextResponse.json(
      { error: 'PARIS generated a draft that failed website validation. No credits were charged.', validation, retryable: true },
      { status: 422 },
    );
  }

  const credit = await consumeWebsiteBuilderCredits(supabase, user.id, 'initial_site_generation', { deferDebitUntilCommit: true });
  if (!credit.allowed) return NextResponse.json({ error: credit.error || 'Not enough Website Builder credits', creditsRemaining: credit.balance, upgradeUrl: credit.upgradeUrl || '/store/apps/website-builder' }, { status: 402 });

  const admin = await requireAdminClient();
  const { data: committed, error, requestId } = await commitWebsiteDraft(admin, {
    p_actor_id: user.id, p_website_id: reusable?.id || null, p_expected_updated_at: reusable?.updated_at || null,
    p_site_name: businessName, p_template_id: config.template.id, p_site_config: config,
    p_plan: Object.hasOwn(PLAN_SITE_LIMITS, plan) ? plan : 'starter',
    p_operation: 'initial_site_generation', p_charge_trial: credit.isTrial,
  });
  if (error || !committed?.website) return NextResponse.json({ error: 'Could not commit generated draft. Refresh before trying again.',
    creditsCharged: error?.code ? 0 : null, requestId }, { status: error?.code === 'P0409' ? 409 : error?.code === 'P0402' ? 402 : 503 });
  const site = committed.website;
  return NextResponse.json({ website: site, generated: true, editUrl: `/apps/website-builder/edit/${site.id}`,
    creditsCharged: committed.creditsCharged, creditsRemaining: committed.creditsRemaining }, { status: reusable?.id ? 200 : 201 });
}

export const POST = withApiAudit('/api/apps/website-builder/ai-generate', _POST);

