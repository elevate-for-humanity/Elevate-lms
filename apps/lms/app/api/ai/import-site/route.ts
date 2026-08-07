import { logger } from '@/lib/logger';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { NextRequest, NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai/ai-service';
import * as cheerio from 'cheerio';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { createClient } from '@/lib/supabase/server';
import { requireFeatureForAuth } from '@/lib/platform/require-feature-for-auth';
import { FEATURES } from '@/lib/platform/feature-catalog';

/**
 * POST /api/ai/import-site
 *
 * Imports an existing public website and recreates its content/configuration on
 * Elevate. Website import is a Professional/Enterprise Website Builder feature
 * or an organization-level WEBSITE_IMPORT entitlement.
 */
async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    if (!auth.userId || auth.userId === 'service-role') {
      return NextResponse.json({ error: 'User authentication required' }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: appSub } = await supabase
      .from('user_app_subscriptions')
      .select('plan, status, trial_ends_at')
      .eq('user_id', auth.userId)
      .eq('app_slug', 'website-builder')
      .maybeSingle();

    const trialIsCurrent =
      appSub?.status !== 'trial' ||
      !appSub?.trial_ends_at ||
      new Date(appSub.trial_ends_at).getTime() >= Date.now();
    const individualImportAllowed =
      !!appSub &&
      ['trial', 'active'].includes(appSub.status || '') &&
      trialIsCurrent &&
      ['professional', 'enterprise'].includes(appSub.plan || '');

    if (!individualImportAllowed) {
      const organizationAccess = await requireFeatureForAuth(request, FEATURES.WEBSITE_IMPORT);
      if (organizationAccess instanceof NextResponse) {
        return NextResponse.json(
          {
            error: 'Website import requires Website Builder Professional/Enterprise or the Website Import add-on.',
            upgradeUrl: '/store/apps/website-builder',
            feature: FEATURES.WEBSITE_IMPORT,
          },
          { status: 403 },
        );
      }
    }

    const body = await request.json();
    const { url, includePages = ['/', '/about', '/programs', '/contact'] } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      assertSafePublicUrl(parsedUrl);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid URL' },
        { status: 400 },
      );
    }

    const scrapedData = await scrapeSite(parsedUrl.origin, includePages);

    if (!scrapedData.success) {
      return NextResponse.json(
        { error: scrapedData.error || 'Failed to scrape site' },
        { status: 400 },
      );
    }

    const siteConfig = await analyzeAndGenerateConfig(scrapedData);
    const previewId = `import_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    return NextResponse.json({
      success: true,
      previewId,
      originalUrl: url,
      extracted: {
        title: scrapedData.title,
        description: scrapedData.description,
        pageCount: scrapedData.pages.length,
        imagesFound: scrapedData.images.length,
        colorsDetected: scrapedData.colors,
      },
      config: {
        ...siteConfig,
        meta: {
          importedFrom: url,
          importedAt: new Date().toISOString(),
          previewId,
        },
      },
      previewUrl: `/preview/${previewId}`,
    });
  } catch (error) {
    logger.error('Import error', normalizeError(error, 'Import failed'), getErrorContext(error));
    return NextResponse.json({ error: 'Failed to import site' }, { status: 500 });
  }
}

function assertSafePublicUrl(url: URL) {
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only public http/https websites can be imported');
  }

  const host = url.hostname.toLowerCase();
  const blockedHosts = new Set(['localhost', '0.0.0.0', '127.0.0.1', '::1']);
  if (blockedHosts.has(host) || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('Private or local network URLs cannot be imported');
  }

  // Reject common private/link-local IPv4 ranges before any server-side fetch.
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);
    if (octets.some((octet) => octet < 0 || octet > 255)) throw new Error('Invalid IP address');
    const [a, b] = octets;
    const privateRange =
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0;
    if (privateRange) throw new Error('Private or local network URLs cannot be imported');
  }
}

interface ScrapedData {
  success: boolean;
  error?: string;
  title: string;
  description: string;
  logo?: string;
  colors: string[];
  fonts: string[];
  navigation: Array<{ label: string; href: string }>;
  pages: Array<{
    url: string;
    title: string;
    headings: string[];
    paragraphs: string[];
    images: string[];
  }>;
  images: string[];
  programs: Array<{ name: string; description: string }>;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

async function scrapeSite(baseUrl: string, pages: string[]): Promise<ScrapedData> {
  const result: ScrapedData = {
    success: false,
    title: '',
    description: '',
    colors: [],
    fonts: [],
    navigation: [],
    pages: [],
    images: [],
    programs: [],
    contactInfo: {},
  };

  try {
    const mainResponse = await fetch(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ElevateLMS-Importer/1.0)',
      },
      redirect: 'follow',
    });

    if (!mainResponse.ok) {
      result.error = `Failed to fetch: ${mainResponse.status}`;
      return result;
    }

    const html = await mainResponse.text();
    const $ = cheerio.load(html);

    result.title = $('title').text().trim() || $('h1').first().text().trim();
    result.description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      $('p').first().text().trim().slice(0, 200);

    result.logo = $('img[alt*="logo" i], img[class*="logo" i], header img').first().attr('src');
    if (result.logo && !result.logo.startsWith('http')) {
      result.logo = new URL(result.logo, baseUrl).href;
    }

    $('nav a, header a, .nav a, .menu a, .navigation a').each((_, el) => {
      const href = $(el).attr('href');
      const label = $(el).text().trim();
      if (href && label && label.length < 30 && !href.startsWith('#')) {
        result.navigation.push({ label, href });
      }
    });
    result.navigation = result.navigation
      .filter((item, index, self) => index === self.findIndex((t) => t.label === item.label))
      .slice(0, 8);

    const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\)|rgba\([^)]+\)/g;
    const styleContent =
      $('style').text() +
      ' ' +
      $('[style]')
        .map((_, el) => $(el).attr('style'))
        .get()
        .join(' ');
    const foundColors = styleContent.match(colorRegex) || [];
    result.colors = [...new Set(foundColors)].slice(0, 10);

    $('img').each((_, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src');
      if (src) {
        if (!src.startsWith('http')) src = new URL(src, baseUrl).href;
        result.images.push(src);
      }
    });
    result.images = [...new Set(result.images)].slice(0, 20);

    $('h2, h3, .card-title, .program-title, .course-title, .service-title').each((_, el) => {
      const name = $(el).text().trim();
      const description =
        $(el).next('p').text().trim() || $(el).parent().find('p').first().text().trim();
      if (name && name.length > 3 && name.length < 100) {
        result.programs.push({ name, description: description.slice(0, 200) });
      }
    });
    result.programs = result.programs.slice(0, 10);

    const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) result.contactInfo.email = emailMatch[0];

    const phoneMatch = html.match(/(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) result.contactInfo.phone = phoneMatch[0];

    for (const pagePath of pages.slice(1, 5)) {
      try {
        const pageUrl = new URL(pagePath, baseUrl);
        if (pageUrl.origin !== new URL(baseUrl).origin) continue;
        assertSafePublicUrl(pageUrl);

        const pageResponse = await fetch(pageUrl.href, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ElevateLMS-Importer/1.0)' },
          redirect: 'follow',
        });

        if (pageResponse.ok) {
          const pageHtml = await pageResponse.text();
          const page$ = cheerio.load(pageHtml);

          result.pages.push({
            url: pageUrl.href,
            title: page$('title').text().trim() || page$('h1').first().text().trim(),
            headings: page$('h1, h2, h3')
              .map((_, el) => page$(el).text().trim())
              .get()
              .slice(0, 10),
            paragraphs: page$('p')
              .map((_, el) => page$(el).text().trim())
              .get()
              .filter((p) => p.length > 50)
              .slice(0, 5),
            images: page$('img')
              .map((_, el) => page$(el).attr('src'))
              .get()
              .slice(0, 5),
          });
        }
      } catch (err) {
        logger.error('Website import subpage failed', err instanceof Error ? err : undefined);
      }
    }

    result.success = true;
    return result;
  } catch {
    result.error = 'Scraping failed';
    return result;
  }
}

async function analyzeAndGenerateConfig(scrapedData: ScrapedData) {
  const prompt = `You are a website migration expert. Analyze this scraped website data and generate a configuration to recreate it on our platform.\n\nScraped Data:\n- Title: ${scrapedData.title}\n- Description: ${scrapedData.description}\n- Navigation: ${JSON.stringify(scrapedData.navigation)}\n- Colors found: ${scrapedData.colors.join(', ')}\n- Programs/Services: ${JSON.stringify(scrapedData.programs.slice(0, 5))}\n- Contact: ${JSON.stringify(scrapedData.contactInfo)}\n- Page titles: ${scrapedData.pages.map((p) => p.title).join(', ')}\n\nGenerate a JSON config with:\n1. branding: { primaryColor, secondaryColor, accentColor, logoText, tagline }\n2. homepage: { heroTitle, heroSubtitle, heroCtaText, features }\n3. programs: Array of programs/services mapped to { name, description, duration, level }\n4. navigation: { label, href } items\n5. footer: { description, contactEmail }\n6. seo: { title, description, keywords }\n7. template: one of modern, professional, bold, warm, academic, industrial\n\nPreserve the source business voice and facts. Do not invent licenses, accreditations, testimonials, ratings, outcomes, addresses or legal claims. Return ONLY valid JSON.`;

  try {
    const completion = await aiChat({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: 'You are a website migration expert. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      maxTokens: 2000,
    });

    const responseText = completion.content || '';
    const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    return {
      branding: {
        primaryColor: scrapedData.colors[0] || '#1e40af',
        secondaryColor: scrapedData.colors[1] || '#3b82f6',
        accentColor: scrapedData.colors[2] || '#f59e0b',
        logoText: scrapedData.title.split('|')[0].split('-')[0].trim(),
        tagline: scrapedData.description.slice(0, 100),
      },
      homepage: {
        heroTitle: `Welcome to ${scrapedData.title.split('|')[0].trim()}`,
        heroSubtitle: scrapedData.description,
        heroCtaText: 'Get Started',
        features: [
          { title: 'Services', description: 'Explore available services and programs.' },
          { title: 'Support', description: 'Connect with the organization for help and next steps.' },
          { title: 'Get Started', description: 'Use the website call to action to begin.' },
        ],
      },
      programs: scrapedData.programs.slice(0, 6).map((p) => ({
        name: p.name,
        description: p.description || '',
        duration: '',
        level: '',
      })),
      navigation: scrapedData.navigation.slice(0, 6),
      footer: {
        description: scrapedData.description.slice(0, 150),
        contactEmail: scrapedData.contactInfo.email || '',
      },
      seo: {
        title: scrapedData.title,
        description: scrapedData.description,
        keywords: [],
      },
      template: 'professional',
    };
  }
}

export const POST = withApiAudit('/api/ai/import-site', _POST);
