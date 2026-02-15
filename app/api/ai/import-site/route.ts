import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// Lazy-load OpenAI client to prevent build-time errors
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  return new OpenAI({ apiKey });
}

/**
 * POST /api/ai/import-site
 * 
 * Imports an existing website and recreates it on Elevate LMS platform.
 * 
 * Flow:
 * 1. Scrape the provided URL
 * 2. Extract content, colors, structure
 * 3. AI analyzes and maps to our templates
 * 4. Generate config that recreates their site
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { url, includePages = ['/', '/about', '/programs', '/contact'] } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Scrape the main page
    const scrapedData = await scrapeSite(parsedUrl.origin, includePages);
    
    if (!scrapedData.success) {
      return NextResponse.json(
        { error: scrapedData.error || 'Failed to scrape site' },
        { status: 400 }
      );
    }

    // Use AI to analyze and generate config
    const siteConfig = await analyzeAndGenerateConfig(scrapedData);

    // Generate preview ID
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
    logger.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import site' },
      { status: 500 }
    );
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
    // Fetch main page
    const mainResponse = await fetch(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ElevateLMS-Importer/1.0)',
      },
    });

    if (!mainResponse.ok) {
      result.error = `Failed to fetch: ${mainResponse.status}`;
      return result;
    }

    const html = await mainResponse.text();
    const $ = cheerio.load(html);

    // Extract basic info
    result.title = $('title').text().trim() || $('h1').first().text().trim();
    result.description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || 
                         $('p').first().text().trim().slice(0, 200);

    // Extract logo
    result.logo = $('img[alt*="logo" i], img[class*="logo" i], header img').first().attr('src');
    if (result.logo && !result.logo.startsWith('http')) {
      result.logo = new URL(result.logo, baseUrl).href;
    }

    // Extract navigation
    $('nav a, header a, .nav a, .menu a, .navigation a').each((_, el) => {
      const href = $(el).attr('href');
      const label = $(el).text().trim();
      if (href && label && label.length < 30 && !href.startsWith('#')) {
        result.navigation.push({ label, href });
      }
    });
    // Dedupe navigation
    result.navigation = result.navigation.filter((item, index, self) =>
      index === self.findIndex(t => t.label === item.label)
    ).slice(0, 8);

    // Extract colors from inline styles and stylesheets
    const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\)|rgba\([^)]+\)/g;
    const styleContent = $('style').text() + ' ' + $('[style]').map((_, el) => $(el).attr('style')).get().join(' ');
    const foundColors = styleContent.match(colorRegex) || [];
    result.colors = [...new Set(foundColors)].slice(0, 10);

    // Extract images
    $('img').each((_, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src');
      if (src) {
        if (!src.startsWith('http')) {
          src = new URL(src, baseUrl).href;
        }
        result.images.push(src);
      }
    });
    result.images = [...new Set(result.images)].slice(0, 20);

    // Extract potential programs/courses/services
    $('h2, h3, .card-title, .program-title, .course-title, .service-title').each((_, el) => {
      const name = $(el).text().trim();
      const description = $(el).next('p').text().trim() || 
                         $(el).parent().find('p').first().text().trim();
      if (name && name.length > 3 && name.length < 100) {
        result.programs.push({ name, description: description.slice(0, 200) });
      }
    });
    result.programs = result.programs.slice(0, 10);

    // Extract contact info
    const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) result.contactInfo.email = emailMatch[0];

    const phoneMatch = html.match(/(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) result.contactInfo.phone = phoneMatch[0];

    // Scrape additional pages
    for (const pagePath of pages.slice(1, 5)) { // Limit to 5 pages
      try {
        const pageUrl = new URL(pagePath, baseUrl).href;
        const pageResponse = await fetch(pageUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ElevateLMS-Importer/1.0)' },
        });
        
        if (pageResponse.ok) {
          const pageHtml = await pageResponse.text();
          const page$ = cheerio.load(pageHtml);
          
          result.pages.push({
            url: pageUrl,
            title: page$('title').text().trim() || page$('h1').first().text().trim(),
            headings: page$('h1, h2, h3').map((_, el) => page$(el).text().trim()).get().slice(0, 10),
            paragraphs: page$('p').map((_, el) => page$(el).text().trim()).get().filter(p => p.length > 50).slice(0, 5),
            images: page$('img').map((_, el) => page$(el).attr('src')).get().slice(0, 5),
          });
        }
      } catch {
        // Skip failed pages
      }
    }

    result.success = true;
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Scraping failed';
    return result;
  }
}

async function analyzeAndGenerateConfig(scrapedData: ScrapedData) {
  const prompt = `You are a website migration expert. Analyze this scraped website data and generate a configuration to recreate it on our LMS platform.

Scraped Data:
- Title: ${scrapedData.title}
- Description: ${scrapedData.description}
- Navigation: ${JSON.stringify(scrapedData.navigation)}
- Colors found: ${scrapedData.colors.join(', ')}
- Programs/Services: ${JSON.stringify(scrapedData.programs.slice(0, 5))}
- Contact: ${JSON.stringify(scrapedData.contactInfo)}
- Page titles: ${scrapedData.pages.map(p => p.title).join(', ')}

Generate a JSON config with:
1. branding: { primaryColor (pick from their colors or suggest), secondaryColor, accentColor, logoText (from title), tagline }
2. homepage: { heroTitle, heroSubtitle, heroCtaText, features (array of 3 based on their content) }
3. programs: Array of their programs/services mapped to { name, description, duration (estimate), level }
4. navigation: Clean up their nav items { label, href }
5. footer: { description, contactEmail }
6. seo: { title, description, keywords }
7. template: Recommend one of: "modern", "professional", "bold", "warm", "academic", "industrial"

Keep their branding voice and content. Make it feel like THEIR site, just on our platform.
Return ONLY valid JSON.`;

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a website migration expert. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    // Return default config based on scraped data
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
          { title: 'Quality Training', description: 'Industry-recognized programs' },
          { title: 'Expert Support', description: 'Dedicated instructors' },
          { title: 'Career Success', description: 'Job placement assistance' },
        ],
      },
      programs: scrapedData.programs.slice(0, 6).map(p => ({
        name: p.name,
        description: p.description || 'Professional training program',
        duration: '8 weeks',
        level: 'All Levels',
      })),
      navigation: scrapedData.navigation.slice(0, 6),
      footer: {
        description: scrapedData.description.slice(0, 150),
        contactEmail: scrapedData.contactInfo.email || 'info@example.com',
      },
      seo: {
        title: scrapedData.title,
        description: scrapedData.description,
        keywords: ['training', 'education', 'professional development'],
      },
      template: 'professional',
    };
  }
}
