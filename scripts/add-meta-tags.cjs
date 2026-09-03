#!/usr/bin/env node
/**
 * Add SEO meta tags to all HTML pages
 */

const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://elevateforhumanity.org';
const GOOGLE_ANALYTICS_ID = 'G-EFHWORKFORCE01';

const metaTags = `
<!-- SEO Meta Tags -->
<meta name="description" content="Elevate for Humanity - Government-approved workforce development. WIOA, DOL, DOE compliant. 70% less than LearnWorlds.">
<meta name="keywords" content="workforce development, career training, WIOA, DOL, Indianapolis jobs, online learning, LMS, government training">
<meta name="author" content="Elevate for Humanity">
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:title" content="Elevate for Humanity - Workforce Development">
<meta property="og:description" content="Government-approved career training platform">
<meta property="twitter:card" content="summary_large_image">

<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GOOGLE_ANALYTICS_ID}');
</script>
`;

function addMetaTags(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already has meta tags
  if (content.includes('G-EFHWORKFORCE01')) {
    return false;
  }

  // Add after <head> tag
  if (content.includes('<head>')) {
    content = content.replace('<head>', '<head>' + metaTags);
    fs.writeFileSync(filePath, content);
    return true;
  }

  return false;
}

function processDirectory(dir) {
  let count = 0;

  function scan(directory) {
    const items = fs.readdirSync(directory);

    items.forEach((item) => {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
        scan(fullPath);
      } else if (item.endsWith('.html')) {
        if (addMetaTags(fullPath)) {
          count++;
          console.log(`✅ Added meta tags to ${fullPath}`);
        }
      }
    });
  }

  if (fs.existsSync(dir)) {
    scan(dir);
  }

  return count;
}

console.log('🚀 Adding meta tags to all pages...\n');

let total = 0;
['public', 'sites', 'pages', 'docs'].forEach((dir) => {
  const count = processDirectory(dir);
  total += count;
});

console.log(`\n✅ Added meta tags to ${total} pages`);
