#!/usr/bin/env node
/**
 * Verification Script for Google Console Setup
 * Checks that all SEO and Google configurations are properly implemented
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();


// Check 1: Google Configuration Script
const googleConfigPath = path.join(ROOT, 'scripts/apply-google-config.js');
if (fs.existsSync(googleConfigPath)) {
} else {
}

// Check 2: Package.json scripts
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')
  );
  if (packageJson.scripts && packageJson.scripts['google:apply']) {
  } else {
  }

  if (packageJson.scripts && packageJson.scripts['sitemaps:generate']) {
  } else {
  }
} catch (error) {
}

// Check 3: Key HTML files have proper meta tags
const keyFiles = ['index.html', 'programs.html', 'hub.html'];

keyFiles.forEach((file) => {
  const filePath = path.join(ROOT, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for Open Graph tags
    const hasOG =
      content.includes('property="og:title"') &&
      content.includes('property="og:description"');

    // Check for Twitter Cards
    const hasTwitter = content.includes('property="twitter:card"');

    // Check for Google Analytics
    const hasGA =
      content.includes('googletagmanager.com/gtag/js') ||
      content.includes('gtag(');

  } else {
  }
});

// Check 4: Google Site Verification file
const verificationPath = path.join(ROOT, 'google-site-verification.html');
if (fs.existsSync(verificationPath)) {
  const content = fs.readFileSync(verificationPath, 'utf8');
  if (content.includes('google-site-verification')) {

    // Check if it still has placeholder
    if (content.includes('GOOGLE_VERIFICATION_CODE_HERE')) {
        '   ⚠️  Still contains placeholder - run npm run google:apply'
      );
    } else {
    }
  } else {
  }
} else {
}

// Check 5: Sitemaps
const sitemapIndexPath = path.join(ROOT, 'sitemap-index.xml');
const sitemapsDir = path.join(ROOT, 'sitemaps');

if (fs.existsSync(sitemapIndexPath)) {
} else {
    '   ❌ sitemap-index.xml missing - run npm run sitemaps:generate'
  );
}

if (fs.existsSync(sitemapsDir)) {
  const sitemapFiles = fs
    .readdirSync(sitemapsDir)
    .filter((f) => f.endsWith('.xml'));
} else {
}

// Check 6: Robots.txt
const robotsPath = path.join(ROOT, 'robots.txt');
if (fs.existsSync(robotsPath)) {
  const content = fs.readFileSync(robotsPath, 'utf8');
  if (content.includes('Sitemap:')) {
  } else {
  }
} else {
}

// Check 7: Environment variables setup
const envExamplePath = path.join(ROOT, '.env.local.example');
if (fs.existsSync(envExamplePath)) {
} else {
}

  '1. Set your actual Google Analytics ID and Search Console verification code'
);
