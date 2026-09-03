#!/usr/bin/env node
/*
  Idempotently injects <meta name="stripe-publishable-key" content="..."> into all HTML files
  using env let VITE_STRIPE_PUBLIC_KEY or STRIPE_PUBLISHABLE_KEY.
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PUBLISHABLE =
  process.env.VITE_STRIPE_PUBLIC_KEY ||
  process.env.STRIPE_PUBLISHABLE_KEY ||
  '';

if (!PUBLISHABLE) {
    '[stripe:inject-pk] No VITE_STRIPE_PUBLIC_KEY or STRIPE_PUBLISHABLE_KEY set. Skipping.'
  );
  process.exit(0);
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    // Skip node_modules, dist, .git
    if (
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === '.git'
    )
      continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) processHtml(full);
  }
}

function processHtml(filePath) {
  try {
    let html = fs.readFileSync(filePath, 'utf8');
    const hasMeta = /<meta\s+name=["']stripe-publishable-key["'][^>]*>/i.test(
      html
    );
    const headCloseIdx = html.indexOf('</head>');
    if (headCloseIdx === -1) return; // skip if malformed

    const metaTag = `<meta name="stripe-publishable-key" content="${PUBLISHABLE}">`;
    if (hasMeta) {
      // Update existing content
      html = html.replace(
        /<meta\s+name=["']stripe-publishable-key["'][^>]*content=["'][^"']*["'][^>]*>/i,
        metaTag
      );
    } else {
      // Inject before </head>
      html =
        html.slice(0, headCloseIdx) +
        `\n    ${metaTag}\n` +
        html.slice(headCloseIdx);
    }
    fs.writeFileSync(filePath, html);
  } catch (e) {
  }
}

walk(ROOT);
