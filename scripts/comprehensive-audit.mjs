#!/usr/bin/env node

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const appDir = join(__dirname, '..', 'app');
const publicDir = join(__dirname, '..', 'public');

// Find all page files
function findAllPages(dir, baseDir = dir) {
  let pages = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!item.startsWith('.') && item !== 'node_modules' && item !== 'api') {
        pages = pages.concat(findAllPages(fullPath, baseDir));
      }
    } else if (
      item === 'page.tsx' ||
      item === 'page.ts' ||
      item === 'page.jsx' ||
      item === 'page.js'
    ) {
      const relativePath =
        fullPath.replace(baseDir, '').replace(/\/page\.(tsx|ts|jsx|js)$/, '') || '/';
      pages.push({
        path: relativePath,
        file: fullPath,
      });
    }
  }

  return pages;
}

// Check if image exists
function checkImageExists(imagePath) {
  try {
    const fullPath = join(publicDir, imagePath.replace(/^\//, ''));
    statSync(fullPath);
    return true;
  } catch {
    return false;
  }
}

// Extract image paths from content
function extractImages(content) {
  const images = [];
  const imageRegex = /src=["']([^"']+)["']/g;
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    if (match[1].startsWith('/images/') || match[1].startsWith('/')) {
      images.push(match[1]);
    }
  }

  return images;
}

// Extract links from content
function extractLinks(content) {
  const links = [];
  const linkRegex = /(?:href|to)=["']([^"']+)["']/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    if (match[1].startsWith('/') && !match[1].startsWith('//')) {
      links.push(match[1]);
    }
  }

  return links;
}

// Analyze page in detail
function analyzePageDetailed(filePath, allPagePaths) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const images = extractImages(content);
    const links = extractLinks(content);

    // Check for hero image (1920x800-1000px recommendation)
    const hasHeroSection = /hero|Hero|banner|Banner/.test(content);
    const heroImages = images.filter((img) => /hero|banner|large|header/i.test(img));

    // Check image quality indicators
    const hasQualitySettings = /quality=\{?\d+\}?/.test(content);

    // Check for alt text on all images
    const imageMatches = content.match(/<Image[^>]*>/g) || [];
    const imagesWithAlt = imageMatches.filter((img) => /alt=["'][^"']+["']/.test(img));
    const imagesWithoutAlt = imageMatches.length - imagesWithAlt.length;

    // Check for CTAs
    const ctaPatterns = [
      /Apply Now/i,
      /Get Started/i,
      /Contact Us/i,
      /Learn More/i,
      /Enroll Now/i,
      /Sign Up/i,
      /Register/i,
      /Schedule/i,
      /Book/i,
    ];
    const ctaCount = ctaPatterns.filter((pattern) => pattern.test(content)).length;

    // Check for placeholders
    const placeholderPatterns = [
      /TODO/,
      /FIXME/,
      /XXX/,
      /placeholder/i,
      /coming soon/i,
      /Lorem ipsum/i,
      /\[Your .+?\]/,
      /\{.+?\}/,
    ];
    const placeholders = placeholderPatterns.filter((pattern) => pattern.test(content));

    // Check metadata
    const hasMetadata = /export const metadata/.test(content);
    const hasTitle = /title:\s*["']/.test(content);
    const hasDescription = /description:\s*["']/.test(content);

    // Check for broken internal links
    const brokenLinks = links.filter((link) => {
      const cleanLink = link.split('?')[0].split('#')[0];
      return (
        !allPagePaths.includes(cleanLink) &&
        !cleanLink.startsWith('/api/') &&
        !cleanLink.startsWith('/images/')
      );
    });

    // Check for missing images
    const missingImages = images.filter((img) => !checkImageExists(img));

    // Content quality checks
    const wordCount = content.split(/\s+/).length;
    const hasRichContent = wordCount > 200;

    return {
      // Hero banner audit
      hasHeroSection,
      heroImages: heroImages.length,
      hasQualitySettings,

      // CTA buttons
      ctaCount,
      hasCTA: ctaCount > 0,

      // Content
      wordCount,
      hasRichContent,
      hasPlaceholders: placeholders.length > 0,
      placeholderCount: placeholders.length,

      // Images
      totalImages: images.length,
      imagesWithoutAlt,
      missingImages: missingImages.length,
      missingImagePaths: missingImages,

      // Links
      totalLinks: links.length,
      brokenLinks: brokenLinks.length,
      brokenLinkPaths: brokenLinks,

      // Metadata
      hasMetadata,
      hasTitle,
      hasDescription,

      // Auth
      isAuthRequired: /redirect\(['"]\/login['"]\)|createClient|getUser/.test(content),

      lineCount: content.split('\n').length,
    };
  } catch (error) {
    return null;
  }
}

// Categorize pages
function categorizePage(path) {
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/student') || path.startsWith('/lms')) return 'lms';
  if (path.startsWith('/instructor')) return 'instructor';
  if (path.startsWith('/program-holder')) return 'program-holder';
  if (path.startsWith('/employer')) return 'employer';
  if (path.startsWith('/partner')) return 'partner';
  if (path.startsWith('/programs')) return 'programs';
  if (path.startsWith('/courses')) return 'courses';
  if (path.startsWith('/auth') || path === '/login' || path === '/signup') return 'auth';
  if (path.startsWith('/delegate') || path.startsWith('/board')) return 'delegate';
  return 'marketing';
}

const pages = findAllPages(appDir);
const allPagePaths = pages.map((p) => p.path);

const auditResults = {
  totalPages: pages.length,
  categories: {},
  issues: {
    noHeroImage: [],
    noCTA: [],
    hasPlaceholders: [],
    noMetadata: [],
    imagesWithoutAlt: [],
    brokenLinks: [],
    missingImages: [],
    thinContent: [],
  },
  summary: {},
};

// Analyze each page
for (const page of pages) {
  const category = categorizePage(page.path);
  const analysis = analyzePageDetailed(page.file, allPagePaths);

  if (!auditResults.categories[category]) {
    auditResults.categories[category] = [];
  }

  if (analysis) {
    const pageData = {
      path: page.path,
      ...analysis,
    };

    auditResults.categories[category].push(pageData);

    // Track issues
    if (!analysis.hasHeroSection && ['marketing', 'programs'].includes(category)) {
      auditResults.issues.noHeroImage.push(page.path);
    }
    if (!analysis.hasCTA && ['marketing', 'programs'].includes(category)) {
      auditResults.issues.noCTA.push(page.path);
    }
    if (analysis.hasPlaceholders) {
      auditResults.issues.hasPlaceholders.push({
        path: page.path,
        count: analysis.placeholderCount,
      });
    }
    if (!analysis.hasMetadata || !analysis.hasTitle || !analysis.hasDescription) {
      auditResults.issues.noMetadata.push(page.path);
    }
    if (analysis.imagesWithoutAlt > 0) {
      auditResults.issues.imagesWithoutAlt.push({
        path: page.path,
        count: analysis.imagesWithoutAlt,
      });
    }
    if (analysis.brokenLinks > 0) {
      auditResults.issues.brokenLinks.push({
        path: page.path,
        links: analysis.brokenLinkPaths,
      });
    }
    if (analysis.missingImages > 0) {
      auditResults.issues.missingImages.push({
        path: page.path,
        images: analysis.missingImagePaths,
      });
    }
    if (!analysis.hasRichContent && ['marketing', 'programs'].includes(category)) {
      auditResults.issues.thinContent.push({
        path: page.path,
        wordCount: analysis.wordCount,
      });
    }
  }
}

// Generate summary
for (const [category, pageList] of Object.entries(auditResults.categories)) {
  auditResults.summary[category] = {
    total: pageList.length,
    withHero: pageList.filter((p) => p.hasHeroSection).length,
    withCTA: pageList.filter((p) => p.hasCTA).length,
    withMetadata: pageList.filter((p) => p.hasMetadata && p.hasTitle && p.hasDescription).length,
    withPlaceholders: pageList.filter((p) => p.hasPlaceholders).length,
    withBrokenLinks: pageList.filter((p) => p.brokenLinks > 0).length,
    withMissingImages: pageList.filter((p) => p.missingImages > 0).length,
    withImagesNoAlt: pageList.filter((p) => p.imagesWithoutAlt > 0).length,
  };
}

// Print summary

for (const [category, stats] of Object.entries(auditResults.summary)) {
}

// Save results
writeFileSync(
  join(__dirname, '..', 'comprehensive-audit-results.json'),
  JSON.stringify(auditResults, null, 2),
);
