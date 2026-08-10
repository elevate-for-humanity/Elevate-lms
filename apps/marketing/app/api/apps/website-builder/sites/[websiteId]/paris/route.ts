import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { aiChat } from '@/lib/ai/ai-service';
import { buildDefaultSiteConfig, mergeSiteConfig } from '@/lib/tenant/default-site-config';
import type { TenantSiteConfig } from '@/lib/tenant/site-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function safeString(value: unknown, max = 2400): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanJson(content: string): Record<string, unknown> {
  const cleaned = content.replace(/```json?/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned) as Record<string, unknown>;
}

function safeFeatures(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return value.slice(0, 8).map((item) => ({
    title: safeString((item as any)?.title, 120) || 'Feature',
    description: safeString((item as any)?.description, 500),
  }));
}

function safePrograms(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return value.slice(0, 20).map((item) => ({
    name: safeString((item as any)?.name, 140) || 'Service',
    description: safeString((item as any)?.description, 700),
    ...(safeString((item as any)?.duration, 80) ? { duration: safeString((item as any)?.duration, 80) } : {}),
    ...(safeString((item as any)?.level, 80) ? { level: safeString((item as any)?.level, 80) } : {}),
  }));
}

function safeNavigation(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return value.slice(0, 12).map((item) => ({
    label: safeString((item as any)?.label, 80) || 'Page',
    href: safeString((item as any)?.href, 200) || '/',
  }));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  await hydrateProcessEnv();
  const { websiteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: site, error: readError } = await supabase
    .from('user_websites')
    .select('id, user_id, site_name, site_config, is_published')
    .eq('id', websiteId)
    .maybeSingle();

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!site || site.user_id !== user.id) return NextResponse.json({ error: 'Website not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const instruction = safeString(body.instruction, 4000);
  if (!instruction) return NextResponse.json({ error: 'Tell PARIS what you want changed' }, { status: 400 });

  const conversation = Array.isArray(body.conversation)
    ? body.conversation
        .slice(-8)
        .map((message: any) => ({
          role: message?.role === 'assistant' ? 'assistant' : 'user',
          content: safeString(message?.content, 1200),
        }))
        .filter((message: any) => message.content)
    : [];

  const base = buildDefaultSiteConfig({ organizationName: site.site_name || 'My Website' });
  const currentConfig = site.site_config && typeof site.site_config === 'object'
    ? mergeSiteConfig(base, site.site_config as Partial<TenantSiteConfig>)
    : base;

  const responseShape = {
    message: 'Short explanation of what PARIS changed.',
    siteName: 'optional revised site name',
    siteConfig: {
      branding: {
        primaryColor: '#hex',
        secondaryColor: '#hex',
        accentColor: '#hex',
        backgroundColor: '#hex',
        textColor: '#hex',
        logoText: 'text',
        tagline: 'text',
      },
      homepage: {
        heroTitle: 'text',
        heroSubtitle: 'text',
        heroCtaText: 'text',
        features: [{ title: 'text', description: 'text' }],
      },
      programs: [{ name: 'text', description: 'text', duration: 'optional', level: 'optional' }],
      navigation: [{ label: 'text', href: '/path' }],
      footer: { description: 'text', contactEmail: 'optional email' },
      seo: { title: 'text', description: 'text', keywords: ['text'] },
    },
  };

  let generated: any;
  try {
    const result = await aiChat({
      messages: [
        {
          role: 'system',
          content: `You are PARIS, the persistent AI website-building copilot inside Elevate Website Builder. The user is actively editing an existing website. Apply the user's instruction to the CURRENT site configuration and return ONLY valid JSON matching this shape:\n${JSON.stringify(responseShape, null, 2)}\n\nRules:\n- Return only fields that should change; do not erase unrelated current content.\n- You may rewrite copy, branding, homepage content, features, programs/services, navigation, footer and SEO.\n- Never publish the site, purchase a domain, change billing, or claim you completed an external action.\n- Do not invent licenses, accreditations, testimonials, ratings, addresses, outcomes or legal claims.\n- If the user asks for a visual style, translate it into colors/copy/layout content that this schema supports.\n- Keep navigation hrefs internal and sensible unless the user explicitly supplied an external URL.\n- message must be concise and describe the actual changes you made.\n\nCURRENT SITE CONFIGURATION:\n${JSON.stringify(currentConfig)}`,
        },
        ...conversation,
        { role: 'user', content: instruction },
      ],
      temperature: 0.35,
      maxTokens: 2600,
    });
    generated = cleanJson(result.content);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'PARIS could not update the website',
    }, { status: 502 });
  }

  const rawPatch = generated?.siteConfig && typeof generated.siteConfig === 'object'
    ? generated.siteConfig
    : {};

  const patch: Partial<TenantSiteConfig> = {};
  if (rawPatch.branding && typeof rawPatch.branding === 'object') {
    patch.branding = {
      ...currentConfig.branding,
      ...(safeString(rawPatch.branding.primaryColor, 20) ? { primaryColor: safeString(rawPatch.branding.primaryColor, 20) } : {}),
      ...(safeString(rawPatch.branding.secondaryColor, 20) ? { secondaryColor: safeString(rawPatch.branding.secondaryColor, 20) } : {}),
      ...(safeString(rawPatch.branding.accentColor, 20) ? { accentColor: safeString(rawPatch.branding.accentColor, 20) } : {}),
      ...(safeString(rawPatch.branding.backgroundColor, 20) ? { backgroundColor: safeString(rawPatch.branding.backgroundColor, 20) } : {}),
      ...(safeString(rawPatch.branding.textColor, 20) ? { textColor: safeString(rawPatch.branding.textColor, 20) } : {}),
      ...(safeString(rawPatch.branding.logoText, 160) ? { logoText: safeString(rawPatch.branding.logoText, 160) } : {}),
      ...(safeString(rawPatch.branding.tagline, 300) ? { tagline: safeString(rawPatch.branding.tagline, 300) } : {}),
    };
  }
  if (rawPatch.homepage && typeof rawPatch.homepage === 'object') {
    patch.homepage = {
      ...currentConfig.homepage,
      ...(safeString(rawPatch.homepage.heroTitle, 240) ? { heroTitle: safeString(rawPatch.homepage.heroTitle, 240) } : {}),
      ...(safeString(rawPatch.homepage.heroSubtitle, 700) ? { heroSubtitle: safeString(rawPatch.homepage.heroSubtitle, 700) } : {}),
      ...(safeString(rawPatch.homepage.heroCtaText, 100) ? { heroCtaText: safeString(rawPatch.homepage.heroCtaText, 100) } : {}),
      ...(safeFeatures(rawPatch.homepage.features) ? { features: safeFeatures(rawPatch.homepage.features)! } : {}),
    };
  }

  const programs = safePrograms(rawPatch.programs);
  if (programs) patch.programs = programs;

  const navigation = safeNavigation(rawPatch.navigation);
  if (navigation) patch.navigation = navigation;

  if (rawPatch.footer && typeof rawPatch.footer === 'object') {
    patch.footer = {
      ...currentConfig.footer,
      ...(safeString(rawPatch.footer.description, 700) ? { description: safeString(rawPatch.footer.description, 700) } : {}),
      ...(safeString(rawPatch.footer.contactEmail, 240) ? { contactEmail: safeString(rawPatch.footer.contactEmail, 240) } : {}),
    };
  }

  if (rawPatch.seo && typeof rawPatch.seo === 'object') {
    patch.seo = {
      title: safeString(rawPatch.seo.title, 180) || currentConfig.seo?.title || site.site_name || 'Website',
      description: safeString(rawPatch.seo.description, 500) || currentConfig.seo?.description || '',
      keywords: Array.isArray(rawPatch.seo.keywords)
        ? rawPatch.seo.keywords.map((value: unknown) => safeString(value, 80)).filter(Boolean).slice(0, 20)
        : currentConfig.seo?.keywords || [],
    };
  }

  const merged = mergeSiteConfig(currentConfig, patch);
  const nextSiteName = safeString(generated?.siteName, 120) || site.site_name || 'My Website';

  const { data: saved, error: saveError } = await supabase
    .from('user_websites')
    .update({
      site_name: nextSiteName,
      site_config: merged,
      updated_at: new Date().toISOString(),
    })
    .eq('id', websiteId)
    .eq('user_id', user.id)
    .select('id, site_name, subdomain, is_published, site_config')
    .maybeSingle();

  if (saveError || !saved) {
    return NextResponse.json({ error: saveError?.message || 'Could not save PARIS changes' }, { status: 500 });
  }

  return NextResponse.json({
    message: safeString(generated?.message, 500) || 'I updated your website draft.',
    website: saved,
  });
}
