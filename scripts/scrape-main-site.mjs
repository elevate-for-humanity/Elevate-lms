#!/usr/bin/env node
/**
 * Scrape Main Site Content
 * Pulls pages from www.www.elevateforhumanity.org and creates dynamic pages
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.elevateforhumanity.org';
const OUTPUT_DIR = path.join(__dirname, '../src/data/scraped-pages');

// Pages to scrape
const PAGES = [
  { path: '/', name: 'home' },
  { path: '/about', name: 'about' },
  { path: '/contact', name: 'contact' },
  { path: '/services', name: 'services' },
  { path: '/faq', name: 'faq' },
  { path: '/blog', name: 'blog' },
];

/**
 * Fetch HTML from URL
 */
async function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { rejectUnauthorized: false }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

/**
 * Extract content from HTML
 */
function extractContent(html, pageName) {
  const content = {
    name: pageName,
    title: '',
    description: '',
    sections: [],
  };

  // Extract title
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  if (titleMatch) {
    content.title = titleMatch[1].replace(/&amp;/g, '&');
  }

  // Extract meta description
  const descMatch = html.match(/<meta name="description"[^>]*content="([^"]*)"/);
  if (descMatch) {
    content.description = descMatch[1];
  }

  // Extract hero section
  const heroMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/);
  if (heroMatch) {
    const heroText = heroMatch[1].replace(/<[^>]*>/g, '');
    content.sections.push({
      type: 'hero',
      title: heroText,
      subtitle: '',
    });
  }

  // Extract all headings and paragraphs
  const h2Matches = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)];
  h2Matches.forEach((match) => {
    const heading = match[1].replace(/<[^>]*>/g, '').trim();
    if (heading) {
      content.sections.push({
        type: 'heading',
        text: heading,
      });
    }
  });

  // Extract paragraphs
  const pMatches = [...html.matchAll(/<p[^>]*>(.*?)<\/p>/g)];
  const paragraphs = pMatches
    .map((m) => m[1].replace(/<[^>]*>/g, '').trim())
    .filter((p) => p.length > 20 && !p.includes('cookie'));

  paragraphs.forEach((p) => {
    content.sections.push({
      type: 'text',
      content: p,
    });
  });

  // Extract images
  const imgMatches = [...html.matchAll(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"/g)];
  imgMatches.forEach((match) => {
    const [, alt, src] = match;
    if (src && !src.includes('data:image')) {
      content.sections.push({
        type: 'image',
        alt: alt,
        src: src.startsWith('http') ? src : `${BASE_URL}${src}`,
      });
    }
  });

  return content;
}

/**
 * Main scraper
 */
async function scrapePages() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results = [];

  for (const page of PAGES) {
    try {
      const url = `${BASE_URL}${page.path}`;
      const html = await fetchHTML(url);
      const content = extractContent(html, page.name);

      // Save to file
      const outputPath = path.join(OUTPUT_DIR, `${page.name}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(content, null, 2));

      results.push(content);

      // Be nice to the server
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Error scraping ${page.path}:`, error.message);
    }
  }

  // Save index
  const indexPath = path.join(OUTPUT_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(results, null, 2));
}

// Run scraper
scrapePages().catch(console.error);
