#!/usr/bin/env node
// 🎯 Multi-page static site optimization for incremental deployment
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = 'deploy';

// 1. Ensure all page directories have proper structure
const pageDirectories = [
  {
    dir: 'programs',
    title: 'Programs | Elevate for Humanity',
    description: 'Workforce development programs and certifications',
  },
  {
    dir: 'contracts',
    title: 'Government Contracts | Elevate for Humanity',
    description: 'Government contracting and workforce services',
  },
  {
    dir: 'students',
    title: 'Student Portal | Elevate for Humanity',
    description: 'Access your courses and track progress',
  },
  {
    dir: 'contact',
    title: 'Contact Us | Elevate for Humanity',
    description: 'Get in touch with our team',
  },
  {
    dir: 'about',
    title: 'About Us | Elevate for Humanity',
    description: 'Learn about our mission and services',
  },
];

pageDirectories.forEach(({ dir, title, description }) => {
  const dirPath = path.join(ROOT, dir);
  const indexPath = path.join(dirPath, 'index.html');

  // Create directory if it doesn't exist
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // If index.html doesn't exist, create a basic one
  if (!fs.existsSync(indexPath)) {
    const basicHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="https://www.elevateforhumanity.org/${dir}/">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        nav { margin-bottom: 2rem; }
        nav a { margin-right: 1rem; color: #007bff; text-decoration: none; }
    </style>
</head>
<body>
    <nav>
        <a href="/">Home</a>
        <a href="/programs/">Programs</a>
        <a href="/contracts/">Government Contracts</a>
        <a href="/students/">Student Portal</a>
        <a href="/contact/">Contact</a>
    </nav>
    <div class="container">
        <h1>${title.split(' | ')[0]}</h1>
        <p>${description}</p>
        <p>This page is under construction. Please check back soon!</p>
    </div>
</body>
</html>`;

    fs.writeFileSync(indexPath, basicHTML);
  }
});

// 2. Optimize HTML files for performance
function optimizeHTML(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Add preconnect for external resources
    if (!content.includes('preconnect')) {
      content = content.replace(
        '<head>',
        `<head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
      );
    }

    // Add viewport meta if missing
    if (!content.includes('viewport')) {
      content = content.replace(
        '<head>',
        '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      );
    }

    // Minify inline CSS (basic)
    content = content
      .replace(/\s+/g, ' ')
      .replace(/;\s+/g, ';')
      .replace(/{\s+/g, '{')
      .replace(/\s+}/g, '}');

    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    return false;
  }
}

// 3. Find and optimize all HTML files
const htmlFiles = [];
function findHTMLFiles(dir) {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    files.forEach((file) => {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        findHTMLFiles(fullPath);
      } else if (file.name.endsWith('.html')) {
        htmlFiles.push(fullPath);
      }
    });
  } catch (error) {
    // Ignore errors
  }
}

findHTMLFiles(ROOT);

let optimizedCount = 0;
htmlFiles.forEach((file) => {
  if (optimizeHTML(file)) {
    optimizedCount++;
  }
});

// 4. Create .htaccess for Apache servers (if needed)
const htaccess = `# Elevate for Humanity - Apache Configuration
RewriteEngine On

# Clean URLs
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^programs/?$ /programs/index.html [L]
RewriteRule ^contracts/?$ /contracts/index.html [L]
RewriteRule ^students/?$ /students/index.html [L]
RewriteRule ^contact/?$ /contact/index.html [L]
RewriteRule ^about/?$ /about/index.html [L]

# Legacy redirects
RewriteRule ^programs\\.html$ /programs/ [R=301,L]
RewriteRule ^government-services\\.html$ /contracts/ [R=301,L]
RewriteRule ^account\\.html$ /students/ [R=301,L]
RewriteRule ^connect\\.html$ /contact/ [R=301,L]

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/html "access plus 1 hour"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>`;

fs.writeFileSync(path.join(ROOT, '.htaccess'), htaccess);

// 5. Create deployment summary
const deploymentSummary = {
  type: 'multi-page-static',
  timestamp: new Date().toISOString(),
  pages: pageDirectories.map((p) => p.dir),
  htmlFiles: htmlFiles.length,
  optimizedFiles: optimizedCount,
  features: [
    'Clean URLs (/programs/ instead of /programs.html)',
    'Proper canonical URLs for SEO',
    'Optimized HTML with preconnect hints',
    'Apache .htaccess configuration',
    'Legacy redirect handling',
    'Security headers configuration',
  ],
};

fs.writeFileSync(
  path.join(ROOT, 'deployment-summary.json'),
  JSON.stringify(deploymentSummary, null, 2),
);
