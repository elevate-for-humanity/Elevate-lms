#!/usr/bin/env node

/**
 * Simple CSS Extractor - No Puppeteer Required
 * Extracts CSS, design tokens, and styling from www.elevateforhumanity.org
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_URL = 'https://www.elevateforhumanity.org';
const OUTPUT_DIR = path.join(process.cwd(), 'extracted-styles');

async function extractCSS() {

  try {
    // Create output directory
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Fetch homepage
    const response = await fetch(TARGET_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Parse HTML
    const $ = cheerio.load(html);

    // Extract inline styles
    const inlineStyles = [];
    $('style').each((i, el) => {
      const css = $(el).html();
      if (css) {
        inlineStyles.push(css);
      }
    });

    const allInlineCSS = inlineStyles.join('\n\n');
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'inline-styles.css'),
      allInlineCSS,
      'utf-8'
    );

    // Extract external stylesheets
    const stylesheetUrls = [];
    $('link[rel="stylesheet"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        stylesheetUrls.push(href);
      }
    });

    let externalCSS = '';
    for (const href of stylesheetUrls) {
      try {
        const cssUrl = href.startsWith('http')
          ? href
          : new URL(href, TARGET_URL).toString();

        const cssResponse = await fetch(cssUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (cssResponse.ok) {
          const css = await cssResponse.text();
          externalCSS += `/* Source: ${cssUrl} */\n${css}\n\n`;
        }
      } catch (error) {
      }
    }

    await fs.writeFile(
      path.join(OUTPUT_DIR, 'external-stylesheets.css'),
      externalCSS,
      'utf-8'
    );

    // Combine all CSS
    const allCSS = allInlineCSS + '\n\n' + externalCSS;
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'all-styles.css'),
      allCSS,
      'utf-8'
    );

    // Extract design tokens from CSS
    const tokens = {
      colors: extractColors(allCSS),
      fonts: extractFonts(allCSS),
      fontSizes: extractFontSizes(allCSS),
      spacing: extractSpacing(allCSS),
      borderRadius: extractBorderRadius(allCSS),
      boxShadows: extractBoxShadows(allCSS),
      cssVariables: extractCSSVariables(allCSS),
    };

    await fs.writeFile(
      path.join(OUTPUT_DIR, 'design-tokens.json'),
      JSON.stringify(tokens, null, 2),
      'utf-8'
    );

      `   - ${Object.keys(tokens.cssVariables).length} CSS variables`
    );

    // Extract HTML structure
    const structure = {
      title: $('title').text(),
      metaDescription: $('meta[name="description"]').attr('content') || '',
      headers: [],
      navigation: [],
      buttons: [],
      cards: [],
      forms: [],
      footer: [],
    };

    // Headers
    $('header, [role="banner"]').each((i, el) => {
      structure.headers.push({
        html: $(el).html()?.substring(0, 500),
        classes: $(el).attr('class'),
      });
    });

    // Navigation
    $('nav, [role="navigation"]').each((i, el) => {
      structure.navigation.push({
        html: $(el).html()?.substring(0, 500),
        classes: $(el).attr('class'),
      });
    });

    // Buttons
    $('button, .btn, [role="button"]').each((i, el) => {
      structure.buttons.push({
        text: $(el).text().trim(),
        html: $(el).prop('outerHTML'),
        classes: $(el).attr('class'),
      });
    });

    // Cards
    $('.card, [class*="card"]').each((i, el) => {
      structure.cards.push({
        html: $(el).html()?.substring(0, 500),
        classes: $(el).attr('class'),
      });
    });

    // Forms
    $('form').each((i, el) => {
      structure.forms.push({
        html: $(el).html()?.substring(0, 500),
        classes: $(el).attr('class'),
        action: $(el).attr('action'),
        method: $(el).attr('method'),
      });
    });

    // Footer
    $('footer, [role="contentinfo"]').each((i, el) => {
      structure.footer.push({
        html: $(el).html()?.substring(0, 500),
        classes: $(el).attr('class'),
      });
    });

    await fs.writeFile(
      path.join(OUTPUT_DIR, 'html-structure.json'),
      JSON.stringify(structure, null, 2),
      'utf-8'
    );

    // Generate Tailwind config
    const tailwindConfig = generateTailwindConfig(tokens);
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'tailwind.config.js'),
      tailwindConfig,
      'utf-8'
    );

    // Generate summary
    const summary = {
      extractedAt: new Date().toISOString(),
      targetUrl: TARGET_URL,
      stats: {
        inlineStyles: inlineStyles.length,
        externalStylesheets: stylesheetUrls.length,
        totalCSSSize: allCSS.length,
        colors: tokens.colors.length,
        fonts: tokens.fonts.length,
        cssVariables: Object.keys(tokens.cssVariables).length,
        components: {
          headers: structure.headers.length,
          navigation: structure.navigation.length,
          buttons: structure.buttons.length,
          cards: structure.cards.length,
          forms: structure.forms.length,
          footer: structure.footer.length,
        },
      },
      files: [
        'inline-styles.css',
        'external-stylesheets.css',
        'all-styles.css',
        'design-tokens.json',
        'html-structure.json',
        'tailwind.config.js',
      ],
    };

    await fs.writeFile(
      path.join(OUTPUT_DIR, 'extraction-summary.json'),
      JSON.stringify(summary, null, 2),
      'utf-8'
    );

      `   - External stylesheets: ${summary.stats.externalStylesheets}`
    );
      `   - Total CSS size: ${(summary.stats.totalCSSSize / 1024).toFixed(2)} KB`
    );
    summary.files.forEach((file) => {
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function extractColors(css) {
  const colors = new Set();
  const colorRegex = /#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)/g;
  const matches = css.match(colorRegex) || [];
  matches.forEach((color) => colors.add(color));
  return Array.from(colors);
}

function extractFonts(css) {
  const fonts = new Set();
  const fontRegex = /font-family:\s*([^;]+);/g;
  let match;
  while ((match = fontRegex.exec(css)) !== null) {
    fonts.add(match[1].trim());
  }
  return Array.from(fonts);
}

function extractFontSizes(css) {
  const sizes = new Set();
  const sizeRegex = /font-size:\s*([^;]+);/g;
  let match;
  while ((match = sizeRegex.exec(css)) !== null) {
    sizes.add(match[1].trim());
  }
  return Array.from(sizes);
}

function extractSpacing(css) {
  const spacing = new Set();
  const spacingRegex = /(?:padding|margin):\s*([^;]+);/g;
  let match;
  while ((match = spacingRegex.exec(css)) !== null) {
    const value = match[1].trim();
    if (value !== '0' && value !== '0px') {
      spacing.add(value);
    }
  }
  return Array.from(spacing);
}

function extractBorderRadius(css) {
  const radius = new Set();
  const radiusRegex = /border-radius:\s*([^;]+);/g;
  let match;
  while ((match = radiusRegex.exec(css)) !== null) {
    const value = match[1].trim();
    if (value !== '0' && value !== '0px') {
      radius.add(value);
    }
  }
  return Array.from(radius);
}

function extractBoxShadows(css) {
  const shadows = new Set();
  const shadowRegex = /box-shadow:\s*([^;]+);/g;
  let match;
  while ((match = shadowRegex.exec(css)) !== null) {
    const value = match[1].trim();
    if (value !== 'none') {
      shadows.add(value);
    }
  }
  return Array.from(shadows);
}

function extractCSSVariables(css) {
  const variables = {};
  const varRegex = /--([\w-]+):\s*([^;]+);/g;
  let match;
  while ((match = varRegex.exec(css)) !== null) {
    variables[`--${match[1]}`] = match[2].trim();
  }
  return variables;
}

function generateTailwindConfig(tokens) {
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Extracted colors from www.elevateforhumanity.org
        ${tokens.colors
          .slice(0, 20)
          .map((color, idx) => `'extracted-${idx + 1}': '${color}',`)
          .join('\n        ')}
      },
      fontFamily: {
        // Extracted fonts from www.elevateforhumanity.org
        ${tokens.fonts
          .slice(0, 5)
          .map((font, idx) => `'extracted-${idx + 1}': [${font}],`)
          .join('\n        ')}
      },
    },
  },
  plugins: [],
};
`;
}

// Run extraction
extractCSS();
