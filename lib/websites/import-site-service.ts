import * as cheerio from 'cheerio';
import { aiChat } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';

export interface ScrapedWebsiteData {
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

export function assertSafePublicImportUrl(url: URL) {
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only public http/https websites can be imported');
  }

  const host = url.hostname.toLowerCase();
  const blockedHosts = new Set(['localhost', '0.0.0.0', '127.0.0.1', '::1']);
  if (blockedHosts.has(host) || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('Private or local network URLs cannot be imported');
  }

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

export async function importExistingWebsite(
  rawUrl: string,
  includePages: string[] = ['/', '/about', '/programs', '/contact'],
) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
    assertSafePublicImportUrl(parsedUrl);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Invalid URL');
  }

  const scrapedData = await scrapeSite(parsedUrl.origin, includePages);
  if (!scrapedData.success) {
    throw new Error(scrapedData.error || 'Failed to scrape site');
  }

  const config = await analyzeAndGenerateConfig(scrapedData);
  const previewId = `import_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  return {
    previewId,
    originalUrl: rawUrl,
    extracted: {
      title: scrapedData.title,
      description: scrapedData.description,
      pageCount: scrapedData.pages.length,
      imagesFound: scrapedData.images.length,
      colorsDetected: scrapedData.colors,
    },
    config: {
      ...config,
      meta: {
        ...(config.meta || {}),
        importedFrom: rawUrl,
        importedAt: new Date().toISOString(),
        previewId,
      },
    },
  };
}

async function scrapeSite(baseUrl: string, pages: string[]): Promise<ScrapedWebsiteData> {
  const result: ScrapedWebsiteData = {
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
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ElevateWebsiteImporter/1.0)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });

    if (!mainResponse.ok) {
      result.error = `Failed to fetch: ${mainResponse.status}`;
      return result;
    }

    const contentType = mainResponse.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      result.error = 'The supplied URL is not an HTML website';
      return result;
    }

    const html = (await mainResponse.text()).slice(0, 2_000_000);
    const $ = cheerio.load(html);

    result.title = $('title').text().trim() || $('h1').first().text().trim();
    result.description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      $('p').first().text().trim().slice(0, 300);

    result.logo = $('img[alt*="logo" i], img[class*="logo" i], header img').first().attr('src');
    if (result.logo && !result.logo.startsWith('http')) {
      result.logo = new URL(result.logo, baseUrl).href;
    }

    $('nav a, header a, .nav a, .menu a, .navigation a').each((_, el) => {
      const href = $(el).attr('href');
      const label = $(el).text().trim();
      if (href && label && label.length < 50 && !href.startsWith('#')) result.navigation.push({ label, href });
    });
    result.navigation = result.navigation
      .filter((item, index, self) => index === self.findIndex((candidate) => candidate.label === item.label))
      .slice(0, 12);

    const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\)|rgba\([^)]+\)/g;
    const styleContent = `${$('style').text()} ${$('[style]').map((_, el) => $(el).attr('style')).get().join(' ')}`;
    result.colors = [...new Set(styleContent.match(colorRegex) || [])].slice(0, 12);

    $('img').each((_, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src');
      if (!src) return;
      try {
        if (!src.startsWith('http')) src = new URL(src, baseUrl).href;
        result.images.push(src);
      } catch {
        // Ignore malformed image URLs.
      }
    });
    result.images = [...new Set(result.images)].slice(0, 30);

    $('h2, h3, .card-title, .program-title, .course-title, .service-title').each((_, el) => {
      const name = $(el).text().trim();
      const description = $(el).next('p').text().trim() || $(el).parent().find('p').first().text().trim();
      if (name && name.length > 3 && name.length < 120) {
        result.programs.push({ name, description: description.slice(0, 400) });
      }
    });
    result.programs = result.programs.slice(0, 16);

    const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) result.contactInfo.email = emailMatch[0];
    const phoneMatch = html.match(/(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) result.contactInfo.phone = phoneMatch[0];

    const origin = new URL(baseUrl).origin;
    for (const pagePath of pages.slice(1, 6)) {
      try {
        const pageUrl = new URL(pagePath, baseUrl);
        if (pageUrl.origin !== origin) continue;
        assertSafePublicImportUrl(pageUrl);
        const pageResponse = await fetch(pageUrl.href, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ElevateWebsiteImporter/1.0)' },
          redirect: 'follow',
          signal: AbortSignal.timeout(10000),
        });
        if (!pageResponse.ok) continue;
        const pageType = pageResponse.headers.get('content-type') || '';
        if (!pageType.includes('text/html')) continue;
        const pageHtml = (await pageResponse.text()).slice(0, 1_000_000);
        const page$ = cheerio.load(pageHtml);
        result.pages.push({
          url: pageUrl.href,
          title: page$('title').text().trim() || page$('h1').first().text().trim(),
          headings: page$('h1, h2, h3').map((_, el) => page$(el).text().trim()).get().slice(0, 12),
          paragraphs: page$('p').map((_, el) => page$(el).text().trim()).get().filter((p) => p.length > 40).slice(0, 8),
          images: page$('img').map((_, el) => page$(el).attr('src')).get().slice(0, 8),
        });
      } catch (error) {
        logger.debug('[website-import] subpage skipped', { error: String(error) });
      }
    }

    result.success = true;
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Scraping failed';
    return result;
  }
}

async function analyzeAndGenerateConfig(scrapedData: ScrapedWebsiteData): Promise<any> {
  const prompt = `Analyze this public website and generate an Elevate website configuration that preserves the organization's factual content and brand voice.\n\nTitle: ${scrapedData.title}\nDescription: ${scrapedData.description}\nNavigation: ${JSON.stringify(scrapedData.navigation)}\nColors: ${scrapedData.colors.join(', ')}\nServices/programs: ${JSON.stringify(scrapedData.programs.slice(0, 10))}\nContact: ${JSON.stringify(scrapedData.contactInfo)}\nPage titles: ${scrapedData.pages.map((p) => p.title).join(', ')}\n\nReturn ONLY JSON with branding, homepage, programs, navigation, footer, seo and template. Never invent licenses, accreditations, testimonials, ratings, outcomes, addresses or legal claims.`;

  try {
    const completion = await aiChat({
      messages: [
        { role: 'system', content: 'You are a website migration expert. Preserve source facts. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.35,
      maxTokens: 2400,
    });
    return JSON.parse((completion.content || '').replace(/```json\n?|\n?```/g, '').trim());
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
        heroTitle: scrapedData.title.split('|')[0].trim(),
        heroSubtitle: scrapedData.description,
        heroCtaText: 'Get Started',
        features: scrapedData.programs.slice(0, 3).map((item) => ({ title: item.name, description: item.description })),
      },
      programs: scrapedData.programs.slice(0, 12).map((item) => ({ name: item.name, description: item.description })),
      navigation: scrapedData.navigation.slice(0, 8),
      footer: { description: scrapedData.description.slice(0, 150), contactEmail: scrapedData.contactInfo.email || '' },
      seo: { title: scrapedData.title, description: scrapedData.description, keywords: [] },
      template: 'professional',
    };
  }
}
