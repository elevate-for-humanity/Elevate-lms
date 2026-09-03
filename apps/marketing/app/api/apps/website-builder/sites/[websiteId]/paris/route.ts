import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { aiChat } from '@/lib/ai/ai-service';
import { buildDefaultSiteConfig, mergeSiteConfig } from '@/lib/tenant/default-site-config';
import { applySiteOperations, ensureComposableSiteConfig, type ParisSiteOperation } from '@/lib/tenant/site-composition';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { consumeWebsiteBuilderCredits } from '@/lib/apps/website-builder-trial';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function safeString(value: unknown, max = 2400): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanJson(content: string): Record<string, any> {
  return JSON.parse(content.replace(/```json?/gi, '').replace(/```/g, '').trim()) as Record<string, any>;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ websiteId: string }> }) {
  await hydrateProcessEnv();
  const { websiteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: site, error: readError } = await supabase.from('user_websites').select('id, user_id, site_name, site_config, is_published').eq('id', websiteId).maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!site || site.user_id !== user.id) return NextResponse.json({ error: 'Website not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const instruction = safeString(body.instruction, 5000);
  if (!instruction) return NextResponse.json({ error: 'Tell PARIS what you want changed' }, { status: 400 });

  const conversation = Array.isArray(body.conversation)
    ? body.conversation.slice(-12).map((message: any) => ({ role: message?.role === 'assistant' ? 'assistant' : 'user', content: safeString(message?.content, 1500) })).filter((message: any) => message.content)
    : [];

  const credit = await consumeWebsiteBuilderCredits(supabase, user.id, 'paris_edit');
  if (!credit.allowed) return NextResponse.json({ error: credit.error || 'Not enough Website Builder credits', creditsRemaining: credit.balance, upgradeUrl: credit.upgradeUrl || '/store/apps/website-builder' }, { status: 402 });

  const base = buildDefaultSiteConfig({ organizationName: site.site_name || 'My Website' });
  const currentConfig = ensureComposableSiteConfig(site.site_config && typeof site.site_config === 'object' ? mergeSiteConfig(base, site.site_config as Partial<TenantSiteConfig>) : base);

  const responseShape = {
    message: 'Short explanation of completed changes.',
    siteName: 'optional revised site name',
    operations: [
      { type: 'create_page', title: 'FAQ', slug: '/faq', navLabel: 'FAQ' },
      { type: 'add_section', page: '/faq', index: 0, section: { type: 'faq', content: { title: 'Frequently Asked Questions', items: [{ question: 'Question', answer: 'Answer' }] }, settings: {} } },
      { type: 'add_section', page: '/contact', section: { type: 'contact_form', content: { title: 'Contact us', fields: [{ name: 'name', label: 'Name', type: 'text', required: true }, { name: 'email', label: 'Email', type: 'email', required: true }, { name: 'message', label: 'How can we help?', type: 'textarea', required: true }] }, settings: {} } },
      { type: 'update_section', page: '/', sectionId: 'existing section id', value: { content: { title: 'New title' }, settings: { align: 'center' } } },
      { type: 'move_section', page: '/', sectionId: 'existing section id', index: 1 },
      { type: 'remove_section', page: '/', sectionId: 'existing section id' },
      { type: 'rename_page', page: '/services', title: 'What We Do', slug: '/what-we-do', navLabel: 'Services' },
      { type: 'delete_page', page: '/old-page' },
      { type: 'update_brand', value: { primaryColor: '#hex', secondaryColor: '#hex', accentColor: '#hex', backgroundColor: '#hex', textColor: '#hex', logoText: 'text', tagline: 'text' } },
      { type: 'update_seo', value: { title: 'text', description: 'text', keywords: ['text'] } },
    ],
  };

  let generated: Record<string, any>;
  try {
    const result = await aiChat({
      messages: [
        {
          role: 'system',
          content: `You are PARIS, the autonomous website-building agent inside Elevate Website Builder. You edit a real multi-page website by issuing operations against its canonical page/section model. Return ONLY valid JSON matching this shape:\n${JSON.stringify(responseShape, null, 2)}\n\nAllowed section types: hero, rich_text, features, services, products, testimonial, stats, gallery, image, video, faq, team, pricing, cta, contact_form, booking.\n\nRules:\n- Execute the user's requested website change through operations; do not merely describe it.\n- You may create, delete, rename and reorder pages; add, update, remove and move sections; and change site-wide branding/SEO.\n- Preserve unrelated content.\n- Use existing page and section IDs from CURRENT SITE when targeting existing sections.\n- When creating a page, add useful sections in the same response.\n- If the user asks for About, FAQ, Team, Gallery, Pricing, Services, Booking, Shop, Contact or another page, create the page if it does not exist.\n- If the user asks for a form, add or update a contact_form section. Supported custom form fields are {name,label,type,required,options?}; type must be text, email, tel, textarea, or select. Every custom form MUST include an email field named exactly "email". Only collect fields reasonably needed for the stated business purpose; never request passwords, Social Security numbers, payment-card data, health records, or other unnecessary sensitive data.\n- If the user asks for booking, use booking. If they ask for video, use video.\n- Never fabricate licenses, accreditations, testimonials, ratings, addresses, outcomes, customers, staff, prices or legal claims.\n- Never purchase a domain, charge money, or change billing. Publishing is handled separately by the user's explicit publish command and deterministic QA gate.\n- Do not return legacy homepage/program/navigation patches; operate on pages and sections.\n- message must state what you actually changed.\n\nCURRENT SITE:\n${JSON.stringify(currentConfig)}`,
        },
        ...conversation,
        { role: 'user', content: instruction },
      ],
      temperature: 0.25,
      maxTokens: 7000,
    });
    generated = cleanJson(result.content);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'PARIS could not update the website', creditsCharged: credit.charged, creditsRemaining: credit.balance }, { status: 502 });
  }

  const operations = Array.isArray(generated.operations) ? generated.operations.slice(0, 40) as ParisSiteOperation[] : [];
  if (!operations.length && !safeString(generated.siteName, 120)) return NextResponse.json({ error: 'PARIS returned no executable website changes', creditsCharged: credit.charged, creditsRemaining: credit.balance }, { status: 502 });

  const nextConfig = applySiteOperations(currentConfig, operations);
  const nextSiteName = safeString(generated.siteName, 120) || site.site_name || 'My Website';
  const { data: saved, error: saveError } = await supabase.from('user_websites').update({ site_name: nextSiteName, site_config: nextConfig, updated_at: new Date().toISOString() }).eq('id', websiteId).eq('user_id', user.id).select('id, site_name, subdomain, is_published, site_config').maybeSingle();

  if (saveError || !saved) return NextResponse.json({ error: saveError?.message || 'Could not save PARIS changes', creditsCharged: credit.charged, creditsRemaining: credit.balance }, { status: 500 });

  return NextResponse.json({
    message: safeString(generated.message, 500) || `I completed ${operations.length} website change${operations.length === 1 ? '' : 's'}.`,
    operationsApplied: operations.length,
    website: saved,
    creditsCharged: credit.charged,
    creditsRemaining: credit.balance,
  });
}
