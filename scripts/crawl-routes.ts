#!/usr/bin/env npx tsx
/**
 * Route Crawler
 *
 * Crawls sitemap URLs and key routes to validate:
 * - No 404s
 * - No empty sections
 * - No placeholder images
 * - No dead CTAs
 *
 * Usage: npx tsx scripts/crawl-routes.ts [base-url]
 * Default base URL: http://localhost:3000
 */

import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_BASE_URL = 'http://localhost:3000';

// Key routes to always check (beyond sitemap)
const KEY_ROUTES = [
  '/',
  '/programs',
  '/programs/healthcare',
  '/programs/skilled-trades',
  '/programs/business',
  '/programs/technology',
  '/about',
  '/contact',
  '/apply',
  '/enroll',
  '/student-portal',
  '/career-services',
  '/success-stories',
  '/faq',
];

// Patterns that indicate placeholder content
const PLACEHOLDER_PATTERNS = [
  /coming\s+soon/gi,
  /lorem\s+ipsum/gi,
  /placeholder/gi,
  /\[insert/gi,
  /TBD/g,
];

// Patterns for placeholder images
const PLACEHOLDER_IMAGE_PATTERNS = [
  /placeholder\.com/i,
  /via\.placeholder/i,
  /placehold\.it/i,
  /picsum\.photos/i,
  /unsplash\.it/i,
];

interface CrawlResult {
  url: string;
  status: number;
  issues: string[];
  responseTime: number;
}

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ElevateLMS-Crawler/1.0',
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function crawlUrl(url: string): Promise<CrawlResult> {
  const startTime = Date.now();
  const issues: string[] = [];

  try {
    const response = await fetchWithTimeout(url);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        url,
        status: response.status,
        issues: [`HTTP ${response.status}`],
        responseTime,
      };
    }

    const html = await response.text();

    // Check for placeholder content
    PLACEHOLDER_PATTERNS.forEach((pattern) => {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        // Filter out false positives (comments, scripts)
        const inContent = matches.filter((m) => {
          const idx = html.indexOf(m);
          const before = html.substring(Math.max(0, idx - 50), idx);
          // Skip if in script or comment
          if (before.includes('<script') || before.includes('<!--')) return false;
          return true;
        });
        if (inContent.length > 0) {
          issues.push(`Placeholder content: "${inContent[0]}"`);
        }
      }
    });

    // Check for placeholder images
    PLACEHOLDER_IMAGE_PATTERNS.forEach((pattern) => {
      if (pattern.test(html)) {
        issues.push(`Placeholder image detected`);
      }
    });

    // Check for dead links (href="#")
    const deadLinkMatches = html.match(/href=["']#["']/g);
    if (deadLinkMatches && deadLinkMatches.length > 3) {
      issues.push(`${deadLinkMatches.length} dead links (href="#")`);
    }

    // Check for empty sections
    const emptySections = html.match(/<section[^>]*>\s*<\/section>/g);
    if (emptySections && emptySections.length > 0) {
      issues.push(`${emptySections.length} empty section(s)`);
    }

    // Check response time
    if (responseTime > 5000) {
      issues.push(`Slow response: ${responseTime}ms`);
    }

    return {
      url,
      status: response.status,
      issues,
      responseTime,
    };
  } catch (error) {
    return {
      url,
      status: 0,
      issues: [error instanceof Error ? error.message : 'Unknown error'],
      responseTime: Date.now() - startTime,
    };
  }
}

async function parseSitemap(baseUrl: string): Promise<string[]> {
  const urls: string[] = [];

  try {
    const response = await fetchWithTimeout(`${baseUrl}/sitemap.xml`);
    if (!response.ok) {
      console.log('⚠️  No sitemap.xml found, using key routes only');
      return [];
    }

    const xml = await response.text();
    const locMatches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);

    for (const match of locMatches) {
      urls.push(match[1]);
    }
  } catch (error) {
    console.log('⚠️  Could not fetch sitemap:', error);
  }

  return urls;
}

async function main() {
  const baseUrl = process.argv[2] || DEFAULT_BASE_URL;

  console.log(`🔍 Route Crawler - Validating ${baseUrl}\n`);

  // Get URLs from sitemap
  const sitemapUrls = await parseSitemap(baseUrl);

  // Combine with key routes
  const keyRouteUrls = KEY_ROUTES.map((route) => `${baseUrl}${route}`);
  const allUrls = [...new Set([...keyRouteUrls, ...sitemapUrls])];

  console.log(`Found ${allUrls.length} URLs to crawl\n`);

  const results: CrawlResult[] = [];
  let passed = 0;
  let failed = 0;

  // Crawl in batches of 5
  const batchSize = 5;
  for (let i = 0; i < allUrls.length; i += batchSize) {
    const batch = allUrls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(crawlUrl));

    batchResults.forEach((result) => {
      results.push(result);

      if (result.status === 200 && result.issues.length === 0) {
        passed++;
        console.log(`✅ ${result.url} (${result.responseTime}ms)`);
      } else {
        failed++;
        console.log(`❌ ${result.url}`);
        console.log(`   Status: ${result.status}`);
        result.issues.forEach((issue) => {
          console.log(`   Issue: ${issue}`);
        });
      }
    });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\nCrawl complete: ${passed} passed, ${failed} failed\n`);

  // Write report
  const report = {
    generated: new Date().toISOString(),
    baseUrl,
    totalUrls: allUrls.length,
    passed,
    failed,
    results: results.filter((r) => r.issues.length > 0 || r.status !== 200),
  };

  const reportPath = path.join(process.cwd(), 'reports', 'crawl-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report written to: ${reportPath}\n`);

  // Exit with error if any failures
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Crawler error:', err);
  process.exit(1);
});
