#!/usr/bin/env node

/**
 * Puppeteer Worker - Extract All CSS and Design Tokens
 * Automatically scrapes elevateforhumanity.org for complete styling
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_URL = 'https://elevateforhumanity.org';
const OUTPUT_DIR = path.join(process.cwd(), 'extracted-styles');

async function extractAllCSS() {

  let browser;

  try {
    // Create output directory
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to target site
    await page.goto(TARGET_URL, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Extract all CSS from stylesheets
    const stylesheets = await page.evaluate(() => {
      const sheets = [];
      for (const sheet of document.styleSheets) {
        try {
          const rules = [];
          for (const rule of sheet.cssRules || []) {
            rules.push(rule.cssText);
          }
          sheets.push({
            href: sheet.href || 'inline',
            rules: rules,
            css: rules.join('\n'),
          });
        } catch (e) {
          // CORS or other access issues
          sheets.push({
            href: sheet.href || 'inline',
            error: 'Access denied (CORS)',
          });
        }
      }
      return sheets;
    });

    let allCSS = '';
    for (const sheet of stylesheets) {
      if (sheet.css) {
        allCSS += `/* Source: ${sheet.href} */\n${sheet.css}\n\n`;
      }
    }

    await fs.writeFile(
      path.join(OUTPUT_DIR, 'all-stylesheets.css'),
      allCSS,
      'utf-8'
    );

    // Extract computed styles for all elements
    const computedStyles = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const styles = {};

      elements.forEach((el) => {
        const computed = window.getComputedStyle(el);
        const selector = el.id
          ? `#${el.id}`
          : el.className
            ? `.${el.className.split(' ')[0]}`
            : el.tagName.toLowerCase();

        if (!styles[selector]) {
          styles[selector] = {};
        }

        // Extract key properties
        const props = [
          'color',
          'background-color',
          'font-family',
          'font-size',
          'font-weight',
          'line-height',
          'padding',
          'margin',
          'border',
          'border-radius',
          'box-shadow',
          'display',
          'position',
          'width',
          'height',
          'max-width',
          'min-height',
        ];

        props.forEach((prop) => {
          const value = computed.getPropertyValue(prop);
          if (value && value !== 'none' && value !== 'auto') {
            styles[selector][prop] = value;
          }
        });
      });

      return styles;
    });

    await fs.writeFile(
      path.join(OUTPUT_DIR, 'computed-styles.json'),
      JSON.stringify(computedStyles, null, 2),
      'utf-8'
    );

    // Extract design tokens (colors, fonts, spacing)
    const designTokens = await page.evaluate(() => {
      const tokens = {
        colors: new Set(),
        fonts: new Set(),
        fontSizes: new Set(),
        spacing: new Set(),
        borderRadius: new Set(),
        boxShadows: new Set(),
      };

      const elements = document.querySelectorAll('*');

      elements.forEach((el) => {
        const computed = window.getComputedStyle(el);

        // Colors
        const color = computed.getPropertyValue('color');
        const bgColor = computed.getPropertyValue('background-color');
        const borderColor = computed.getPropertyValue('border-color');
        if (color && color !== 'rgba(0, 0, 0, 0)') tokens.colors.add(color);
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)')
          tokens.colors.add(bgColor);
        if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)')
          tokens.colors.add(borderColor);

        // Fonts
        const fontFamily = computed.getPropertyValue('font-family');
        if (fontFamily) tokens.fonts.add(fontFamily);

        // Font sizes
        const fontSize = computed.getPropertyValue('font-size');
        if (fontSize) tokens.fontSizes.add(fontSize);

        // Spacing (padding, margin)
        const padding = computed.getPropertyValue('padding');
        const margin = computed.getPropertyValue('margin');
        if (padding && padding !== '0px') tokens.spacing.add(padding);
        if (margin && margin !== '0px') tokens.spacing.add(margin);

        // Border radius
        const borderRadius = computed.getPropertyValue('border-radius');
        if (borderRadius && borderRadius !== '0px')
          tokens.borderRadius.add(borderRadius);

        // Box shadows
        const boxShadow = computed.getPropertyValue('box-shadow');
        if (boxShadow && boxShadow !== 'none') tokens.boxShadows.add(boxShadow);
      });

      return {
        colors: Array.from(tokens.colors),
        fonts: Array.from(tokens.fonts),
        fontSizes: Array.from(tokens.fontSizes),
        spacing: Array.from(tokens.spacing),
        borderRadius: Array.from(tokens.borderRadius),
        boxShadows: Array.from(tokens.boxShadows),
      };
    });

    await fs.writeFile(
      path.join(OUTPUT_DIR, 'design-tokens.json'),
      JSON.stringify(designTokens, null, 2),
      'utf-8'
    );

    // Extract CSS variables
    const cssVariables = await page.evaluate(() => {
      const vars = {};
      const root = document.documentElement;
      const computed = window.getComputedStyle(root);

      for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        if (prop.startsWith('--')) {
          vars[prop] = computed.getPropertyValue(prop).trim();
        }
      }

      return vars;
    });

    await fs.writeFile(
      path.join(OUTPUT_DIR, 'css-variables.json'),
      JSON.stringify(cssVariables, null, 2),
      'utf-8'
    );
      `✅ Extracted ${Object.keys(cssVariables).length} CSS variables`
    );

    // Extract component structure
    const components = await page.evaluate(() => {
      const comps = [];

      // Headers
      document.querySelectorAll('header, [role="banner"]').forEach((el) => {
        comps.push({
          type: 'header',
          html: el.outerHTML.substring(0, 500),
          classes: el.className,
        });
      });

      // Navigation
      document.querySelectorAll('nav, [role="navigation"]').forEach((el) => {
        comps.push({
          type: 'navigation',
          html: el.outerHTML.substring(0, 500),
          classes: el.className,
        });
      });

      // Buttons
      document
        .querySelectorAll('button, .btn, [role="button"]')
        .forEach((el) => {
          comps.push({
            type: 'button',
            html: el.outerHTML,
            classes: el.className,
          });
        });

      // Cards
      document.querySelectorAll('.card, [class*="card"]').forEach((el) => {
        comps.push({
          type: 'card',
          html: el.outerHTML.substring(0, 500),
          classes: el.className,
        });
      });

      // Forms
      document.querySelectorAll('form').forEach((el) => {
        comps.push({
          type: 'form',
          html: el.outerHTML.substring(0, 500),
          classes: el.className,
        });
      });

      // Footer
      document
        .querySelectorAll('footer, [role="contentinfo"]')
        .forEach((el) => {
          comps.push({
            type: 'footer',
            html: el.outerHTML.substring(0, 500),
            classes: el.className,
          });
        });

      return comps;
    });

    await fs.writeFile(
      path.join(OUTPUT_DIR, 'components.json'),
      JSON.stringify(components, null, 2),
      'utf-8'
    );

    // Take full page screenshot
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'full-page.png'),
      fullPage: true,
    });

    // Generate Tailwind config
    const tailwindConfig = generateTailwindConfig(designTokens);
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'tailwind.config.js'),
      tailwindConfig,
      'utf-8'
    );

    // Generate summary report
    const summary = {
      extractedAt: new Date().toISOString(),
      targetUrl: TARGET_URL,
      stats: {
        stylesheets: stylesheets.length,
        cssVariables: Object.keys(cssVariables).length,
        colors: designTokens.colors.length,
        fonts: designTokens.fonts.length,
        components: components.length,
      },
      files: [
        'all-stylesheets.css',
        'computed-styles.json',
        'design-tokens.json',
        'css-variables.json',
        'components.json',
        'tailwind.config.js',
        'full-page.png',
      ],
    };

    await fs.writeFile(
      path.join(OUTPUT_DIR, 'extraction-summary.json'),
      JSON.stringify(summary, null, 2),
      'utf-8'
    );

    summary.files.forEach((file) => {
    });
  } catch (error) {
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function generateTailwindConfig(tokens) {
  // Convert colors to Tailwind format
  const colors = {};
  tokens.colors.forEach((color, idx) => {
    const name = `extracted-${idx + 1}`;
    colors[name] = color;
  });

  // Convert fonts
  const fontFamily = {};
  tokens.fonts.forEach((font, idx) => {
    const name = `extracted-${idx + 1}`;
    fontFamily[name] = font.split(',').map((f) => f.trim());
  });

  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(colors, null, 6)},
      fontFamily: ${JSON.stringify(fontFamily, null, 6)},
      fontSize: ${JSON.stringify(tokens.fontSizes, null, 6)},
      spacing: ${JSON.stringify(tokens.spacing, null, 6)},
      borderRadius: ${JSON.stringify(tokens.borderRadius, null, 6)},
      boxShadow: ${JSON.stringify(tokens.boxShadows, null, 6)},
    },
  },
  plugins: [],
};
`;
}

// Run extraction
extractAllCSS();
