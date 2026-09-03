#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST_DIR = 'dist';
const SITEMAPS_DIR = join(DIST_DIR, 'sitemaps');


// Parse sitemap to get all URLs
function parseSitemap(content) {
  const urls = [];
  const matches = content.matchAll(/<loc>(.*?)<\/loc>/g);
  for (const match of matches) {
    urls.push(match[1]);
  }
  return urls;
}

// Get all URLs from sitemaps
const sitemapFiles = ['sitemap-1.xml', 'sitemap-2.xml', 'sitemap-3.xml'];
let allUrls = [];

sitemapFiles.forEach((file) => {
  try {
    const content = readFileSync(join(SITEMAPS_DIR, file), 'utf8');
    const urls = parseSitemap(content);
    allUrls = allUrls.concat(urls);
  } catch (error) {
  }
});


// Check robots.txt
const robotsContent = readFileSync(join(DIST_DIR, 'robots.txt'), 'utf8');

const disallowRules = robotsContent
  .split('\n')
  .filter((line) => line.trim().startsWith('Disallow:'))
  .map((line) => line.split(':')[1].trim());

disallowRules.forEach((rule) => {
});

// Check if any sitemap URLs are blocked
let blockedCount = 0;

allUrls.forEach((url) => {
  const path = new URL(url).pathname;
  const isBlocked = disallowRules.some((rule) => {
    if (rule.endsWith('*')) {
      return path.startsWith(rule.slice(0, -1));
    }
    return path.startsWith(rule);
  });

  if (isBlocked) {
    blockedCount++;
  }
});

if (blockedCount === 0) {
} else {
}

// Check for common SEO issues

// Check for duplicate URLs
const uniqueUrls = new Set(allUrls);
if (uniqueUrls.size < allUrls.length) {
    `   ⚠️  Found ${allUrls.length - uniqueUrls.size} duplicate URLs`
  );
} else {
}

// Check URL structure
const issues = {
  tooLong: [],
  hasQuery: [],
  hasFragment: [],
  notHttps: [],
};

allUrls.forEach((url) => {
  if (url.length > 100) issues.tooLong.push(url);
  if (url.includes('?')) issues.hasQuery.push(url);
  if (url.includes('#')) issues.hasFragment.push(url);
  if (!url.startsWith('https://')) issues.notHttps.push(url);
});

if (issues.tooLong.length > 0) {
    `   ⚠️  ${issues.tooLong.length} URLs are very long (>100 chars)`
  );
}
if (issues.hasQuery.length > 0) {
}
if (issues.hasFragment.length > 0) {
}
if (issues.notHttps.length > 0) {
} else {
}

if (
  issues.tooLong.length === 0 &&
  issues.hasQuery.length === 0 &&
  issues.hasFragment.length === 0
) {
}

// Priority distribution
const priorities = {
  '1.0': 0,
  0.9: 0,
  0.8: 0,
  0.7: 0,
  0.5: 0,
};

sitemapFiles.forEach((file) => {
  try {
    const content = readFileSync(join(SITEMAPS_DIR, file), 'utf8');
    Object.keys(priorities).forEach((priority) => {
      const matches = content.match(
        new RegExp(`<priority>${priority}</priority>`, 'g')
      );
      if (matches) priorities[priority] += matches.length;
    });
  } catch (error) {}
});

Object.entries(priorities).forEach(([priority, count]) => {
  if (count > 0) {
    const bar = '█'.repeat(Math.ceil(count / 5));
  }
});

// Crawl recommendations

