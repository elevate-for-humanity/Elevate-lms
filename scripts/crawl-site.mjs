#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  baseUrl:
    process.argv.find((arg) => arg.startsWith('--base='))?.split('=')[1] ||
    'http://localhost:8000',
  maxPages:
    parseInt(
      process.argv.find((arg) => arg.startsWith('--max='))?.split('=')[1]
    ) || 1000,
  delay: 100, // ms between requests
  timeout: 10000, // request timeout
  userAgent: 'ElevateForHumanity-Crawler/1.0',
  skipPatterns: [
    /\/admin\//,
    /\/api\//,
    /\/temp\//,
    /\/backup\//,
    /\?utm_/,
    /\?ref=/,
    /\?source=/,
    /#/,
    /\.pdf$/,
    /\.zip$/,
    /\.tar\.gz$/,
  ],
  includePatterns: [
    /^\/$/,
    /^\/programs\//,
    /^\/about\//,
    /^\/contact\//,
    /^\/employers\//,
    /^\/blog\//,
    /^\/resources\//,
    /^\/privacy\//,
    /^\/terms\//,
    /^\/faq\//,
    /^\/accessibility\//,
  ],
};

class SiteCrawler {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.options = { ...config, ...options };
    this.visited = new Set();
    this.queue = new Set(['/']);
    this.pages = [];
    this.errors = [];
    this.robots = null;
    this.startTime = Date.now();
  }

  async init() {

    // Load robots.txt
    try {
      const robotsResponse = await fetch(`${this.baseUrl}/robots.txt`, {
        timeout: this.options.timeout,
        headers: { 'User-Agent': this.options.userAgent },
      });

      if (robotsResponse.ok) {
        const robotsText = await robotsResponse.text();
        this.robots = robotsParser(`${this.baseUrl}/robots.txt`, robotsText);
      }
    } catch (error) {
    }
  }

  isAllowed(url) {
    if (this.robots) {
      return this.robots.isAllowed(url, this.options.userAgent);
    }
    return true;
  }

  shouldSkip(url) {
    const path = new URL(url, this.baseUrl).pathname;

    // Check skip patterns
    for (const pattern of this.options.skipPatterns) {
      if (pattern.test(url) || pattern.test(path)) {
        return true;
      }
    }

    // Check if it matches include patterns (if any)
    if (this.options.includePatterns.length > 0) {
      const matches = this.options.includePatterns.some(
        (pattern) => pattern.test(path) || pattern.test(url)
      );
      if (!matches) {
        return true;
      }
    }

    return false;
  }

  normalizeUrl(url) {
    try {
      const parsed = new URL(url, this.baseUrl);

      // Remove fragments
      parsed.hash = '';

      // Remove common tracking parameters
      const paramsToRemove = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'ref',
        'source',
      ];
      paramsToRemove.forEach((param) => parsed.searchParams.delete(param));

      // Ensure trailing slash for directories
      if (!parsed.pathname.includes('.') && !parsed.pathname.endsWith('/')) {
        parsed.pathname += '/';
      }

      return parsed.toString();
    } catch (error) {
      return null;
    }
  }

  async crawlPage(url) {
    if (this.visited.has(url) || this.visited.size >= this.options.maxPages) {
      return;
    }

    this.visited.add(url);

    try {

      const response = await fetch(url, {
        timeout: this.options.timeout,
        headers: {
          'User-Agent': this.options.userAgent,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      const pageData = {
        url,
        status: response.status,
        contentType: response.headers.get('content-type') || '',
        size: 0,
        title: '',
        description: '',
        h1: '',
        links: [],
        images: [],
        lastModified:
          response.headers.get('last-modified') || new Date().toISOString(),
        crawledAt: new Date().toISOString(),
      };

      if (response.ok && pageData.contentType.includes('text/html')) {
        const html = await response.text();
        pageData.size = html.length;

        const $ = cheerio.load(html);

        // Extract metadata
        pageData.title = $('title').text().trim();
        pageData.description =
          $('meta[name="description"]').attr('content') || '';
        pageData.h1 = $('h1').first().text().trim();

        // Extract links
        $('a[href]').each((i, el) => {
          const href = $(el).attr('href');
          const normalizedUrl = this.normalizeUrl(href);

          if (normalizedUrl && normalizedUrl.startsWith(this.baseUrl)) {
            pageData.links.push({
              url: normalizedUrl,
              text: $(el).text().trim(),
              title: $(el).attr('title') || '',
            });

            // Add to queue if not visited and allowed
            if (
              !this.visited.has(normalizedUrl) &&
              !this.shouldSkip(normalizedUrl) &&
              this.isAllowed(normalizedUrl)
            ) {
              this.queue.add(normalizedUrl);
            }
          }
        });

        // Extract images
        $('img[src]').each((i, el) => {
          const src = $(el).attr('src');
          const alt = $(el).attr('alt') || '';
          if (src) {
            pageData.images.push({
              src: new URL(src, url).toString(),
              alt,
              title: $(el).attr('title') || '',
            });
          }
        });
      }

      this.pages.push(pageData);

      if (!response.ok) {
        this.errors.push({
          url,
          status: response.status,
          error: `HTTP ${response.status}`,
        });
      }
    } catch (error) {
      console.error(`❌ Error crawling ${url}:`, error.message);
      this.errors.push({
        url,
        status: 0,
        error: error.message,
      });
    }

    // Delay between requests
    if (this.options.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.options.delay));
    }
  }

  async crawl() {
    await this.init();

    while (this.queue.size > 0 && this.visited.size < this.options.maxPages) {
      const url = this.queue.values().next().value;
      this.queue.delete(url);
      await this.crawlPage(url);
    }

    const duration = Date.now() - this.startTime;

    return {
      pages: this.pages,
      errors: this.errors,
      stats: {
        totalPages: this.pages.length,
        totalErrors: this.errors.length,
        duration,
        crawledAt: new Date().toISOString(),
      },
    };
  }

  generateSitemaps() {

    // Filter successful pages only
    const validPages = this.pages.filter(
      (page) => page.status === 200 && page.contentType.includes('text/html')
    );

    // Sort by priority (homepage first, then programs, etc.)
    validPages.sort((a, b) => {
      const getPriority = (url) => {
        if (url.endsWith('/') && url.split('/').length === 4) return 1000; // homepage
        if (url.includes('/programs/')) return 900;
        if (
          url.includes('/about/') ||
          url.includes('/contact/') ||
          url.includes('/employers/')
        )
          return 800;
        if (url.includes('/blog/')) return 700;
        return 500;
      };
      return getPriority(b.url) - getPriority(a.url);
    });

    const CHUNK_SIZE = 50000;
    const sitemapFiles = [];

    // Ensure sitemaps directory exists
    if (!fs.existsSync('sitemaps')) {
      fs.mkdirSync('sitemaps', { recursive: true });
    }

    // Generate sitemap chunks
    for (let i = 0; i < validPages.length; i += CHUNK_SIZE) {
      const chunk = validPages.slice(i, i + CHUNK_SIZE);
      const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;
      const filename = `sitemap-${chunkNumber}.xml`;

      const urlEntries = chunk.map((page) => {
        const lastmod = new Date(page.lastModified).toISOString().split('T')[0];
        let priority = '0.5';
        let changefreq = 'monthly';

        // Set priority based on URL importance
        if (page.url === this.baseUrl + '/') {
          priority = '1.0';
          changefreq = 'weekly';
        } else if (page.url.includes('/programs/')) {
          priority = '0.9';
          changefreq = 'weekly';
        } else if (
          page.url.includes('/about/') ||
          page.url.includes('/employers/') ||
          page.url.includes('/contact/')
        ) {
          priority = '0.8';
          changefreq = 'monthly';
        } else if (page.url.includes('/blog/')) {
          priority = '0.7';
          changefreq = 'weekly';
        }

        return {
          loc: page.url,
          lastmod,
          changefreq,
          priority,
        };
      });

      const sitemapXml = {
        '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
        urlset: {
          '@_xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
          url: urlEntries,
        },
      };

      const builder = new XMLBuilder({
        ignoreAttributes: false,
        format: true,
        indentBy: '  ',
      });

      const xmlContent = builder.build(sitemapXml);

      // Write sitemap file
      const filepath = path.join('sitemaps', filename);
      fs.writeFileSync(filepath, xmlContent);
      sitemapFiles.push(filename);

    }

    // Generate sitemap index
    const sitemapIndexEntries = sitemapFiles.map((filename) => ({
      loc: `${this.baseUrl}/sitemaps/${filename}`,
      lastmod: new Date().toISOString().split('T')[0],
    }));

    const sitemapIndexXml = {
      '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
      sitemapindex: {
        '@_xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
        sitemap: sitemapIndexEntries,
      },
    };

    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      indentBy: '  ',
    });

    const indexXmlContent = builder.build(sitemapIndexXml);
    fs.writeFileSync('sitemap_index.xml', indexXmlContent);

      `📋 Generated sitemap_index.xml with ${sitemapFiles.length} sitemap files`
    );

    return {
      sitemapFiles,
      totalUrls: validPages.length,
    };
  }

  async pingSearchEngines() {

    const sitemapUrl = `${this.baseUrl}/sitemap_index.xml`;
    const pingUrls = [
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    ];

    for (const pingUrl of pingUrls) {
      try {
        const response = await fetch(pingUrl, {
          method: 'GET',
          timeout: 10000,
          headers: { 'User-Agent': this.options.userAgent },
        });

        const engine = pingUrl.includes('google') ? 'Google' : 'Bing';
        if (response.ok) {
        } else {
        }
      } catch (error) {
        const engine = pingUrl.includes('google') ? 'Google' : 'Bing';
      }
    }
  }

  generateReports(crawlData) {

    // Write all URLs to text file
    const allUrls = crawlData.pages
      .filter((page) => page.status === 200)
      .map((page) => page.url)
      .sort();

    fs.writeFileSync('all-urls.txt', allUrls.join('\n'));

    // Write JSON report
    fs.writeFileSync('crawl-report.json', JSON.stringify(crawlData, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHtmlReport(crawlData);
    fs.writeFileSync('crawl-report.html', htmlReport);
  }

  generateHtmlReport(crawlData) {
    const { pages, errors, stats } = crawlData;

    const successfulPages = pages.filter((p) => p.status === 200);
    const orphanPages = pages.filter(
      (p) =>
        p.status === 200 &&
        !pages.some((other) =>
          other.links.some((link) => link.url === p.url)
        ) &&
        p.url !== this.baseUrl + '/'
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crawl Report - ${this.baseUrl}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-8">Site Crawl Report</h1>

        <div class="grid md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-lg font-semibold text-green-600">Total Pages</h3>
                <p class="text-3xl font-bold">${stats.totalPages}</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-lg font-semibold text-blue-600">Successful</h3>
                <p class="text-3xl font-bold">${successfulPages.length}</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-lg font-semibold text-red-600">Errors</h3>
                <p class="text-3xl font-bold">${stats.totalErrors}</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-lg font-semibold text-yellow-600">Orphans</h3>
                <p class="text-3xl font-bold">${orphanPages.length}</p>
            </div>
        </div>

        ${
          errors.length > 0
            ? `
        <div class="bg-white rounded-lg shadow mb-8">
            <div class="p-6 border-b">
                <h2 class="text-2xl font-bold text-red-600">Errors</h2>
            </div>
            <div class="p-6">
                <div class="overflow-x-auto">
                    <table class="min-w-full">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left py-2">URL</th>
                                <th class="text-left py-2">Status</th>
                                <th class="text-left py-2">Error</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${errors
                              .map(
                                (error) => `
                            <tr class="border-b">
                                <td class="py-2"><a href="${error.url}" class="text-blue-600 hover:underline">${error.url}</a></td>
                                <td class="py-2">${error.status}</td>
                                <td class="py-2">${error.error}</td>
                            </tr>
                            `
                              )
                              .join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `
            : ''
        }

        ${
          orphanPages.length > 0
            ? `
        <div class="bg-white rounded-lg shadow mb-8">
            <div class="p-6 border-b">
                <h2 class="text-2xl font-bold text-yellow-600">Orphan Pages</h2>
                <p class="text-gray-600">Pages not linked from other pages (may not be discoverable)</p>
            </div>
            <div class="p-6">
                <div class="space-y-2">
                    ${orphanPages
                      .map(
                        (page) => `
                    <div class="flex justify-between items-center py-2 border-b">
                        <a href="${page.url}" class="text-blue-600 hover:underline">${page.url}</a>
                        <span class="text-sm text-gray-500">${page.title}</span>
                    </div>
                    `
                      )
                      .join('')}
                </div>
            </div>
        </div>
        `
            : ''
        }

        <div class="bg-white rounded-lg shadow">
            <div class="p-6 border-b">
                <h2 class="text-2xl font-bold text-green-600">All Pages</h2>
            </div>
            <div class="p-6">
                <div class="overflow-x-auto">
                    <table class="min-w-full">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left py-2">URL</th>
                                <th class="text-left py-2">Title</th>
                                <th class="text-left py-2">Status</th>
                                <th class="text-left py-2">Size</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pages
                              .map(
                                (page) => `
                            <tr class="border-b">
                                <td class="py-2"><a href="${page.url}" class="text-blue-600 hover:underline">${page.url}</a></td>
                                <td class="py-2">${page.title}</td>
                                <td class="py-2"><span class="px-2 py-1 rounded text-sm ${page.status === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${page.status}</span></td>
                                <td class="py-2">${(page.size / 1024).toFixed(1)}KB</td>
                            </tr>
                            `
                              )
                              .join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="mt-8 text-center text-gray-500">
            <p>Generated on ${new Date(stats.crawledAt).toLocaleString()}</p>
            <p>Duration: ${(stats.duration / 1000).toFixed(2)} seconds</p>
        </div>
    </div>
</body>
</html>`;
  }
}

// Main execution
async function main() {
  const baseUrl = config.baseUrl;
  const crawler = new SiteCrawler(baseUrl, config);

  try {
    const crawlData = await crawler.crawl();
    const sitemapData = crawler.generateSitemaps();
    crawler.generateReports(crawlData);

    // Ping search engines if this is a production URL
    if (baseUrl.includes('www.elevateforhumanity.org')) {
      await crawler.pingSearchEngines();
    }

  } catch (error) {
    console.error('❌ Crawl failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default SiteCrawler;
