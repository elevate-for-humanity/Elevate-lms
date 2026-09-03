import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface ImageRequest {
  url: string;
  status: number;
  statusText: string;
  page: string;
  type: 'img' | 'next-image' | 'background' | 'source';
  initiator?: string;
  error?: string;
}

interface AuditResult {
  timestamp: string;
  baseUrl: string;
  totalImages: number;
  failedImages: number;
  successImages: number;
  pages: {
    [page: string]: {
      total: number;
      failed: number;
      images: ImageRequest[];
    };
  };
  failures: ImageRequest[];
  failuresByCategory: {
    notFound: ImageRequest[]; // 404
    forbidden: ImageRequest[]; // 403
    serverError: ImageRequest[]; // 5xx
    blocked: ImageRequest[]; // CSP/CORS
    mixedContent: ImageRequest[]; // http on https
    other: ImageRequest[];
  };
}

const PAGES_TO_AUDIT = [
  '/',
  '/store',
  '/shop',
  '/programs',
  '/programs/healthcare',
  '/programs/skilled-trades',
  '/programs/technology',
  '/lms',
  '/student-portal',
  '/employer-portal',
  '/partner-portal',
  '/admin/staff-portal',
  '/instructor',
  '/employers',
  '/training-providers',
];

async function auditPage(page: Page, url: string, baseUrl: string): Promise<ImageRequest[]> {
  const images: ImageRequest[] = [];
  const pageUrl = `${baseUrl}${url}`;

  // Track all image requests
  page.on('response', async (response) => {
    const reqUrl = response.url();
    const contentType = response.headers()['content-type'] || '';

    // Check if it's an image request
    if (
      contentType.includes('image') ||
      reqUrl.includes('/_next/image') ||
      /\.(jpg|jpeg|png|gif|webp|avif|svg|ico)(\?|$)/i.test(reqUrl)
    ) {
      const status = response.status();
      images.push({
        url: reqUrl,
        status,
        statusText: response.statusText(),
        page: url,
        type: reqUrl.includes('/_next/image') ? 'next-image' : 'img',
        error: status >= 400 ? `HTTP ${status}` : undefined,
      });
    }
  });

  // Track failed requests
  page.on('requestfailed', (request) => {
    const reqUrl = request.url();
    if (
      reqUrl.includes('/_next/image') ||
      /\.(jpg|jpeg|png|gif|webp|avif|svg|ico)(\?|$)/i.test(reqUrl)
    ) {
      images.push({
        url: reqUrl,
        status: 0,
        statusText: 'Failed',
        page: url,
        type: reqUrl.includes('/_next/image') ? 'next-image' : 'img',
        error: request.failure()?.errorText || 'Request failed',
      });
    }
  });

  try {
    await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 30000 });
    // Wait a bit more for lazy-loaded images
    await page.waitForTimeout(2000);

    // Scroll to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1000);
  } catch (error: any) {
    console.error(`Error loading ${url}: ${error.message}`);
  }

  return images;
}

function categorizeFailure(img: ImageRequest): string {
  if (img.status === 404) return 'notFound';
  if (img.status === 403) return 'forbidden';
  if (img.status >= 500) return 'serverError';
  if (img.error?.includes('net::ERR_BLOCKED') || img.error?.includes('CSP')) return 'blocked';
  if (img.url.startsWith('http:') && img.page.startsWith('https:')) return 'mixedContent';
  return 'other';
}

async function runAudit(baseUrl: string): Promise<AuditResult> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const result: AuditResult = {
    timestamp: new Date().toISOString(),
    baseUrl,
    totalImages: 0,
    failedImages: 0,
    successImages: 0,
    pages: {},
    failures: [],
    failuresByCategory: {
      notFound: [],
      forbidden: [],
      serverError: [],
      blocked: [],
      mixedContent: [],
      other: [],
    },
  };

  console.log(`\n🔍 Starting image audit on ${baseUrl}\n`);

  for (const pageUrl of PAGES_TO_AUDIT) {
    console.log(`Auditing: ${pageUrl}`);
    const page = await context.newPage();
    const images = await auditPage(page, pageUrl, baseUrl);
    await page.close();

    const failed = images.filter((img) => img.status >= 400 || img.status === 0);

    result.pages[pageUrl] = {
      total: images.length,
      failed: failed.length,
      images,
    };

    result.totalImages += images.length;
    result.failedImages += failed.length;
    result.successImages += images.length - failed.length;

    for (const img of failed) {
      result.failures.push(img);
      const category = categorizeFailure(img) as keyof typeof result.failuresByCategory;
      result.failuresByCategory[category].push(img);
    }

    console.log(`  ✓ ${images.length} images, ${failed.length} failed`);
  }

  await browser.close();
  return result;
}

function generateMarkdownReport(result: AuditResult): string {
  let md = `# Image Audit Report

**Generated:** ${result.timestamp}
**Base URL:** ${result.baseUrl}

## Summary

| Metric | Count |
|--------|-------|
| Total Images | ${result.totalImages} |
| Successful | ${result.successImages} |
| Failed | ${result.failedImages} |
| Success Rate | ${((result.successImages / result.totalImages) * 100).toFixed(1)}% |

## Failures by Category

| Category | Count |
|----------|-------|
| 404 Not Found | ${result.failuresByCategory.notFound.length} |
| 403 Forbidden | ${result.failuresByCategory.forbidden.length} |
| 5xx Server Error | ${result.failuresByCategory.serverError.length} |
| Blocked (CSP/CORS) | ${result.failuresByCategory.blocked.length} |
| Mixed Content | ${result.failuresByCategory.mixedContent.length} |
| Other | ${result.failuresByCategory.other.length} |

## Pages Audited

| Page | Total | Failed |
|------|-------|--------|
${Object.entries(result.pages)
  .map(([page, data]) => `| ${page} | ${data.total} | ${data.failed} |`)
  .join('\n')}

## Failed Images Detail

`;

  if (result.failures.length === 0) {
    md += '✅ No failed images found!\n';
  } else {
    // Group by category
    for (const [category, images] of Object.entries(result.failuresByCategory)) {
      if (images.length > 0) {
        md += `### ${category.replace(/([A-Z])/g, ' $1').trim()} (${images.length})\n\n`;
        for (const img of images) {
          md += `- **Page:** ${img.page}\n`;
          md += `  - URL: \`${img.url.substring(0, 100)}${img.url.length > 100 ? '...' : ''}\`\n`;
          md += `  - Status: ${img.status} ${img.statusText}\n`;
          if (img.error) md += `  - Error: ${img.error}\n`;
          md += '\n';
        }
      }
    }
  }

  return md;
}

async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:3000';

  console.log('🖼️  Image Audit Tool');
  console.log('====================\n');

  const result = await runAudit(baseUrl);

  // Create reports directory
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Save JSON report
  const jsonPath = path.join(reportsDir, 'image-audit.json');
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
  console.log(`\n📄 JSON report saved to: ${jsonPath}`);

  // Save Markdown report
  const mdPath = path.join(reportsDir, 'image-audit.md');
  fs.writeFileSync(mdPath, generateMarkdownReport(result));
  console.log(`📄 Markdown report saved to: ${mdPath}`);

  // Print summary
  console.log('\n📊 Summary:');
  console.log(`   Total images: ${result.totalImages}`);
  console.log(`   Successful: ${result.successImages}`);
  console.log(`   Failed: ${result.failedImages}`);

  if (result.failedImages > 0) {
    console.log('\n❌ Failed images by category:');
    if (result.failuresByCategory.notFound.length > 0) {
      console.log(`   - 404 Not Found: ${result.failuresByCategory.notFound.length}`);
    }
    if (result.failuresByCategory.forbidden.length > 0) {
      console.log(`   - 403 Forbidden: ${result.failuresByCategory.forbidden.length}`);
    }
    if (result.failuresByCategory.serverError.length > 0) {
      console.log(`   - 5xx Server Error: ${result.failuresByCategory.serverError.length}`);
    }
    if (result.failuresByCategory.blocked.length > 0) {
      console.log(`   - Blocked (CSP/CORS): ${result.failuresByCategory.blocked.length}`);
    }
    if (result.failuresByCategory.mixedContent.length > 0) {
      console.log(`   - Mixed Content: ${result.failuresByCategory.mixedContent.length}`);
    }
    if (result.failuresByCategory.other.length > 0) {
      console.log(`   - Other: ${result.failuresByCategory.other.length}`);
    }
  }

  // Exit with error code if failures found
  process.exit(result.failedImages > 0 ? 1 : 0);
}

main().catch(console.error);
