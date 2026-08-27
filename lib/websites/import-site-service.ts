import * as cheerio from 'cheerio';
import { aiChat } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';

export interface ScrapedWebsiteProduct {
  name: string;
  description: string;
  price?: string;
  compareAtPrice?: string;
  image?: string;
  href: string;
  category?: string;
}

export interface ScrapedWebsiteData {
  success: boolean;
  error?: string;
  title: string;
  description: string;
  logo?: string;
  heroImage?: string;
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
  products: ScrapedWebsiteProduct[];
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
    bookingUrl?: string;
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
    if (a === undefined || b === undefined) throw new Error('Invalid IP address');
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

function toAbsoluteUrl(value: string | undefined, baseUrl: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('data:')) return undefined;
  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return undefined;
  }
}

function bestImageSrc($: cheerio.CheerioAPI, el: any, baseUrl: string): string | undefined {
  const node = $(el);
  const src = node.attr('src') || node.attr('data-src') || node.attr('data-original');
  if (src) return toAbsoluteUrl(src, baseUrl);

  const srcset = node.attr('srcset') || node.attr('data-srcset');
  if (srcset) {
    const candidates = srcset
      .split(',')
      .map((candidate) => candidate.trim().split(/\s+/)[0])
      .filter((candidate): candidate is string => Boolean(candidate));
    return toAbsoluteUrl(candidates.at(-1), baseUrl);
  }
  return undefined;
}

function canonicalImageKey(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const pathname = decodeURIComponent(url.pathname)
      .replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|original|master|\d+x\d*|x\d+)(?=\.[a-z0-9]+$)/i, '')
      .toLowerCase();
    return `${url.hostname.toLowerCase()}${pathname}`;
  } catch {
    return value.split(/[?#]/, 1)[0]?.trim().toLowerCase() || undefined;
  }
}

function looksLikeSharedChromeImage(value?: string): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return /(?:favicon|logo|payment|shopify|icon|badge|placeholder|spinner)/.test(normalized);
}

function dedupeProductMedia(products: ScrapedWebsiteProduct[], reservedImages: string[] = []): ScrapedWebsiteProduct[] {
  const used = new Set<string>();
  for (const image of reservedImages) {
    const key = canonicalImageKey(image);
    if (key) used.add(key);
  }

  return products.map((product) => {
    const key = canonicalImageKey(product.image);
    if (!key || looksLikeSharedChromeImage(product.image)) {
      const { image: _image, ...withoutImage } = product;
      return withoutImage;
    }
    if (used.has(key)) {
      const { image: _image, ...withoutImage } = product;
      return withoutImage;
    }
    used.add(key);
    return product;
  });
}

function dedupeConfiguredImages(config: any) {
  const used = new Set<string>();
  const reserve = (value?: string) => {
    const key = canonicalImageKey(value);
    if (key) used.add(key);
  };
  const uniqueItems = (items: any[] | undefined) =>
    (items || []).map((item) => {
      if (!item?.image) return item;
      const key = canonicalImageKey(item.image);
      if (!key || looksLikeSharedChromeImage(item.image) || used.has(key)) {
        const { image: _image, ...rest } = item;
        return rest;
      }
      used.add(key);
      return item;
    });

  reserve(config?.branding?.logoImage);
  reserve(config?.homepage?.heroImage);

  return {
    ...config,
    homepage: {
      ...(config?.homepage || {}),
      features: uniqueItems(config?.homepage?.features),
    },
    products: uniqueItems(config?.products),
    programs: uniqueItems(config?.programs),
  };
}

function currencyValues(text: string): string[] {
  return [...text.matchAll(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/g)]
    .map((match) => match[1])
    .filter((value): value is string => value !== undefined);
}

function stripQueryAndFragment(value: string): string {
  return value.split(/[?#]/, 1)[0] ?? value;
}

function productContainer($: cheerio.CheerioAPI, anchor: any) {
  const node = $(anchor);
  return node.closest('article, li, .grid__item, .card-wrapper, .product-card-wrapper, .product-item, .product-card').first();
}

function collectProductsFromHtml(
  html: string,
  pageUrl: string,
  existing: ScrapedWebsiteProduct[] = [],
): ScrapedWebsiteProduct[] {
  const $ = cheerio.load(html);
  const byHref = new Map(existing.map((product) => [product.href, product]));

  $('a[href*="/products/"]').each((_, anchor) => {
    const rawHref = $(anchor).attr('href');
    const href = toAbsoluteUrl(rawHref, pageUrl);
    if (!href) return;

    const normalizedHref = stripQueryAndFragment(href);
    const container = productContainer($, anchor);
    const scope = container.length ? container : $(anchor).parent();
    const heading = scope.find('h1, h2, h3, .card__heading, .product-title, .product__title').first().text().trim();
    const anchorText = $(anchor).text().replace(/\s+/g, ' ').trim();
    const name = (heading || anchorText).replace(/\s+/g, ' ').trim().slice(0, 180);
    if (!name || name.length < 2) return;

    const scopeText = scope.text().replace(/\s+/g, ' ').trim();
    const prices = currencyValues(scopeText);
    const imageEl = scope.find('img').first();
    const image = imageEl.length ? bestImageSrc($, imageEl, pageUrl) : undefined;
    const previous = byHref.get(normalizedHref);

    const price = previous?.price || prices.at(-1) || prices[0];
    const compareAtPrice = previous?.compareAtPrice || (prices.length > 1 ? prices[0] : undefined);
    const resolvedImage = previous?.image || image;
    byHref.set(normalizedHref, {
      name: previous?.name || name,
      description: previous?.description || '',
      ...(price ? { price } : {}),
      ...(compareAtPrice ? { compareAtPrice } : {}),
      ...(resolvedImage ? { image: resolvedImage } : {}),
      href: normalizedHref,
      ...(previous?.category ? { category: previous.category } : {}),
    });
  });

  return [...byHref.values()].slice(0, 40);
}

async function enrichProduct(product: ScrapedWebsiteProduct, origin: string): Promise<ScrapedWebsiteProduct> {
  try {
    const productUrl = new URL(product.href);
    if (productUrl.origin !== origin) return product;
    assertSafePublicImportUrl(productUrl);

    const response = await fetch(productUrl.href, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ElevateWebsiteImporter/1.0)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok || !(response.headers.get('content-type') || '').includes('text/html')) return product;

    const html = (await response.text()).slice(0, 1_500_000);
    const $ = cheerio.load(html);
    const name = $('h1').first().text().replace(/\s+/g, ' ').trim() || product.name;
    const description = $(
      '.product__description, .product-description, [class*="product__description"], [class*="product-description"]',
    )
      .first()
      .text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1600);
    const text = $('main').text().replace(/\s+/g, ' ');
    const prices = currencyValues(text);

    const productMedia = $(
      '.product__media img, .product-media img, .product-gallery img, [data-media-id] img, [class*="product__media"] img, [class*="product-media"] img',
    ).first();
    const productMediaImage = productMedia.length ? bestImageSrc($, productMedia, productUrl.href) : undefined;
    const ogImage = toAbsoluteUrl($('meta[property="og:image"]').attr('content'), productUrl.href);
    const image = [ogImage, productMediaImage, product.image].find((candidate) => candidate && !looksLikeSharedChromeImage(candidate));

    const price = product.price || prices.at(-1) || prices[0];
    const compareAtPrice = product.compareAtPrice || (prices.length > 1 ? prices[0] : undefined);
    return {
      ...product,
      name: name.slice(0, 180),
      description: description || product.description,
      ...(price ? { price } : {}),
      ...(compareAtPrice ? { compareAtPrice } : {}),
      ...(image ? { image } : {}),
    };
  } catch (error) {
    logger.debug('[website-import] product detail skipped', { url: product.href, error: String(error) });
    return product;
  }
}

export async function importExistingWebsite(
  rawUrl: string,
  includePages: string[] = ['/', '/about', '/programs', '/contact'],
) {
  const parsedUrl = new URL(rawUrl);
  assertSafePublicImportUrl(parsedUrl);

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
      productsFound: scrapedData.products.length,
      colorsDetected: scrapedData.colors,
    },
    config: {
      ...config,
      meta: {
        ...(config.meta || {}),
        importedFrom: rawUrl,
        importedAt: new Date().toISOString(),
        previewId,
        sourceImageCount: scrapedData.images.length,
        sourceProductCount: scrapedData.products.length,
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
    products: [],
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

    const logo = toAbsoluteUrl(
      $('img[alt*="logo" i], img[class*="logo" i], header img').first().attr('src'),
      baseUrl,
    );
    if (logo) result.logo = logo;
    const heroImage =
      toAbsoluteUrl($('meta[property="og:image"]').attr('content'), baseUrl) ||
      bestImageSrc($, $('main img, section img').first(), baseUrl);
    if (heroImage) result.heroImage = heroImage;

    $('nav a, header a, .nav a, .menu a, .navigation a').each((_, el) => {
      const href = $(el).attr('href');
      const label = $(el).text().replace(/\s+/g, ' ').trim();
      if (!href || !label || label.length >= 60 || href.startsWith('#')) return;
      const absolute = toAbsoluteUrl(href, baseUrl) || href;
      result.navigation.push({ label, href: absolute });
      if (/book|appointment|consultation/i.test(label) && /^https?:/i.test(absolute)) {
        result.contactInfo.bookingUrl = absolute;
      }
    });
    result.navigation = result.navigation
      .filter((item, index, self) => index === self.findIndex((candidate) => candidate.label === item.label))
      .slice(0, 16);

    const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\)|rgba\([^)]+\)/g;
    const styleContent = `${$('style').text()} ${$('[style]').map((_, el) => $(el).attr('style')).get().join(' ')}`;
    result.colors = [...new Set(styleContent.match(colorRegex) || [])].slice(0, 16);

    const fontRegex = /font-family\s*:\s*([^;}]+)/gi;
    result.fonts = [...styleContent.matchAll(fontRegex)]
      .map((match) => (match[1] ?? '').replace(/["']/g, '').trim())
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .slice(0, 8);

    $('img').each((_, el) => {
      const src = bestImageSrc($, el, baseUrl);
      if (src) result.images.push(src);
    });
    result.images = [...new Set(result.images)].slice(0, 80);

    $('h2, h3, .card-title, .program-title, .course-title, .service-title').each((_, el) => {
      const name = $(el).text().replace(/\s+/g, ' ').trim();
      const description =
        $(el).next('p').text().replace(/\s+/g, ' ').trim() ||
        $(el).parent().find('p').first().text().replace(/\s+/g, ' ').trim();
      if (name && name.length > 3 && name.length < 120) {
        result.programs.push({ name, description: description.slice(0, 500) });
      }
    });
    result.programs = result.programs.slice(0, 20);

    result.products = collectProductsFromHtml(html, baseUrl);

    const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) result.contactInfo.email = emailMatch[0];
    const phoneMatch = html.match(/(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) result.contactInfo.phone = phoneMatch[0];

    const origin = new URL(baseUrl).origin;
    const discoveredPaths = pages.slice(1, 6);
    if (/shopify/i.test(html) || $('a[href*="/products/"]').length > 0) {
      discoveredPaths.push('/collections/all');
    }

    const uniquePaths = [...new Set(discoveredPaths)];
    for (const pagePath of uniquePaths) {
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
        const pageHtml = (await pageResponse.text()).slice(0, 1_500_000);
        const page$ = cheerio.load(pageHtml);
        const pageImages = page$('img')
          .map((_, el) => bestImageSrc(page$, el, pageUrl.href))
          .get()
          .filter(Boolean) as string[];
        result.pages.push({
          url: pageUrl.href,
          title: page$('title').text().trim() || page$('h1').first().text().trim(),
          headings: page$('h1, h2, h3')
            .map((_, el) => page$(el).text().replace(/\s+/g, ' ').trim())
            .get()
            .slice(0, 20),
          paragraphs: page$('p')
            .map((_, el) => page$(el).text().replace(/\s+/g, ' ').trim())
            .get()
            .filter((p) => p.length > 40)
            .slice(0, 16),
          images: pageImages.slice(0, 30),
        });
        result.images.push(...pageImages);
        result.products = collectProductsFromHtml(pageHtml, pageUrl.href, result.products);

        const pageText = pageHtml;
        if (!result.contactInfo.email) {
          const match = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (match) result.contactInfo.email = match[0];
        }
        if (!result.contactInfo.phone) {
          const match = pageText.match(/(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
          if (match) result.contactInfo.phone = match[0];
        }
      } catch (error) {
        logger.debug('[website-import] subpage skipped', { error: String(error) });
      }
    }

    result.images = [...new Set(result.images)].slice(0, 120);
    if (result.products.length) {
      const enriched = await Promise.all(result.products.slice(0, 30).map((product) => enrichProduct(product, origin)));
      result.products = dedupeProductMedia(
        enriched.filter((product) => product.name && product.href),
        [result.logo || '', result.heroImage || ''].filter(Boolean),
      );
    }

    result.success = true;
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Scraping failed';
    return result;
  }
}

async function analyzeAndGenerateConfig(scrapedData: ScrapedWebsiteData): Promise<any> {
  const sourceProducts = dedupeProductMedia(
    scrapedData.products.slice(0, 30).map((product) => ({
      name: product.name,
      description: product.description,
      ...(product.price ? { price: product.price } : {}),
      ...(product.compareAtPrice ? { compareAtPrice: product.compareAtPrice } : {}),
      ...(product.image ? { image: product.image } : {}),
      href: product.href,
      ...(product.category ? { category: product.category } : {}),
    })),
    [scrapedData.logo || '', scrapedData.heroImage || ''].filter(Boolean),
  );
  const isStore = sourceProducts.length > 0;

  const prompt = `Analyze this public website and generate an Elevate website configuration that preserves the organization's factual content, brand voice, products, imagery and calls to action. Do not collapse a retail or service business into a generic training-provider website.\n\nTitle: ${scrapedData.title}\nDescription: ${scrapedData.description}\nNavigation: ${JSON.stringify(scrapedData.navigation)}\nColors: ${scrapedData.colors.join(', ')}\nFonts: ${scrapedData.fonts.join(', ')}\nHero image: ${scrapedData.heroImage || ''}\nServices/programs: ${JSON.stringify(scrapedData.programs.slice(0, 12))}\nProducts: ${JSON.stringify(sourceProducts)}\nContact: ${JSON.stringify(scrapedData.contactInfo)}\nPage titles: ${scrapedData.pages.map((p) => p.title).join(', ')}\n\nReturn ONLY JSON with template, branding, homepage, programs, products, contact, navigation, footer, seo and meta. Use homepage.heroImage when a source hero image exists. For a retail site set meta.siteKind to "store" and use a shop-focused CTA. Preserve source product names, prices, image URLs and links. Do not copy retail products into programs. Do not reuse one image for multiple unrelated cards. Never invent licenses, accreditations, testimonials, ratings, outcomes, addresses, medical claims or legal claims.`;

  try {
    const completion = await aiChat({
      messages: [
        { role: 'system', content: 'You are a website migration expert. Preserve source facts and media. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      maxTokens: 5200,
    });
    const parsed = JSON.parse((completion.content || '').replace(/```json\n?|\n?```/g, '').trim());
    const parsedMeta = { ...(parsed.meta || {}) };
    delete parsedMeta.products;

    const normalizedNavigation = (parsed.navigation || scrapedData.navigation || []).map((item: any) => {
      if (isStore && item?.label === 'Shop' && item?.href === '/programs') {
        return { ...item, href: '/shop' };
      }
      return item;
    });

    return dedupeConfiguredImages({
      ...parsed,
      programs: isStore ? [] : parsed.programs || [],
      products: sourceProducts,
      contact: {
        ...(parsed.contact || {}),
        email: scrapedData.contactInfo.email || parsed.contact?.email,
        phone: scrapedData.contactInfo.phone || parsed.contact?.phone,
        bookingUrl: scrapedData.contactInfo.bookingUrl || parsed.contact?.bookingUrl,
      },
      homepage: {
        ...(parsed.homepage || {}),
        heroImage: scrapedData.heroImage || parsed.homepage?.heroImage,
        features: parsed.homepage?.features || [],
      },
      branding: {
        ...(parsed.branding || {}),
        logoImage: scrapedData.logo || parsed.branding?.logoImage,
      },
      navigation: normalizedNavigation,
      meta: {
        ...parsedMeta,
        siteKind: isStore ? 'store' : parsedMeta.siteKind,
      },
    });
  } catch {
    const normalizedNavigation = scrapedData.navigation.slice(0, 12).map((item) => {
      if (isStore && item.label === 'Shop' && item.href.endsWith('/programs')) {
        return { ...item, href: '/shop' };
      }
      return item;
    });

    return dedupeConfiguredImages({
      branding: {
        primaryColor: scrapedData.colors[0] || '#7c3f58',
        secondaryColor: scrapedData.colors[1] || '#6f7f56',
        accentColor: scrapedData.colors[2] || '#c99048',
        logoText: scrapedData.title.split(/[|-]/, 1)[0]?.trim() || scrapedData.title,
        ...(scrapedData.logo ? { logoImage: scrapedData.logo } : {}),
        tagline: scrapedData.description.slice(0, 120),
      },
      homepage: {
        heroTitle: scrapedData.title.split('|', 1)[0]?.trim() || scrapedData.title,
        heroSubtitle: scrapedData.description,
        heroCtaText: isStore ? 'Shop Products' : 'Get Started',
        heroCtaHref: isStore ? '/shop' : '/programs',
        ...(scrapedData.heroImage ? { heroImage: scrapedData.heroImage } : {}),
        features: isStore
          ? []
          : scrapedData.programs.slice(0, 4).map((item) => ({ title: item.name, description: item.description })),
      },
      programs: isStore ? [] : scrapedData.programs.slice(0, 20).map((item) => ({ name: item.name, description: item.description })),
      products: sourceProducts,
      contact: scrapedData.contactInfo,
      navigation: normalizedNavigation,
      footer: { description: scrapedData.description.slice(0, 220), contactEmail: scrapedData.contactInfo.email || '' },
      seo: { title: scrapedData.title, description: scrapedData.description, keywords: [] },
      meta: { siteKind: isStore ? 'store' : 'business' },
    });
  }
}
