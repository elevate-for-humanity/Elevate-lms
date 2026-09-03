#!/usr/bin/env node
/**
 * Inject SEO meta tags into built HTML files
 * Run after `npm run build` to add route-specific meta tags
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '../dist');

// Route-specific SEO configuration
const routeConfig = {
  '/programs': {
    title: 'Training Programs | Elevate for Humanity',
    description:
      'Browse 15+ WIOA-funded training programs including healthcare, technology, skilled trades, and business management. 12-20 week programs with 95% job placement rate in Marion County, IN.',
    keywords:
      'training programs, healthcare training, tech apprenticeship, skilled trades, business management, WIOA funding, Marion County IN',
    robots: 'index, follow',
  },
  '/get-started': {
    title: 'Apply Now - Get Started | Elevate for Humanity',
    description:
      'Start your career transformation today. Apply for WIOA-funded training programs. Free application, financial aid available, flexible schedules in Marion County, IN.',
    keywords:
      'apply now, enrollment, WIOA application, career training application, Marion County IN',
    robots: 'index, follow',
  },
  '/hub': {
    title: 'Student Hub | Elevate for Humanity',
    description:
      'Access your courses, assignments, grades, and resources. Student portal for enrolled learners.',
    keywords: 'student portal, student hub, course access, learning management',
    robots: 'index, follow',
  },
  '/connect': {
    title: 'Contact Us | Elevate for Humanity',
    description:
      'Get in touch with Elevate for Humanity Career and Technical Institute. Located in Marion County, IN. Admissions, support, and partnership inquiries.',
    keywords:
      'contact, Marion County IN, career training contact, admissions office',
    robots: 'index, follow',
  },
  '/lms': {
    title: 'Learning Management System | Elevate for Humanity',
    description:
      'Access our comprehensive LMS with courses, video conferencing, file storage, and collaboration tools. Google Workspace alternative for education.',
    keywords:
      'LMS, learning management system, online courses, education platform',
    robots: 'index, follow',
  },
  '/student': {
    title: 'Student Portal | Elevate for Humanity',
    description: 'Student portal login and dashboard.',
    keywords: 'student login, student portal',
    robots: 'index, follow',
  },
  '/meet': {
    title: 'Video Conferencing | Elevate for Humanity',
    description: 'HD video conferencing for classes and meetings.',
    keywords: 'video conferencing, online classes',
    robots: 'index, follow',
  },
  '/drive': {
    title: 'File Storage | Elevate for Humanity',
    description: 'Cloud file storage and management.',
    keywords: 'file storage, cloud drive',
    robots: 'index, follow',
  },
  '/calendar': {
    title: 'Calendar | Elevate for Humanity',
    description: 'Schedule and event management.',
    keywords: 'calendar, scheduling',
    robots: 'index, follow',
  },
};

/**
 * Read the base index.html
 */
function getBaseHTML() {
  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('dist/index.html not found. Run `npm run build` first.');
  }
  return fs.readFileSync(indexPath, 'utf-8');
}

/**
 * Inject route-specific meta tags
 */
function injectMeta(html, route, config) {
  const baseUrl = 'https://elevateforhumanity.org';
  const canonicalUrl = `${baseUrl}${route}`;

  // Replace title
  html = html.replace(/<title>.*?<\/title>/, `<title>${config.title}</title>`);

  // Replace or add meta description (use global flag to replace all instances)
  if (html.includes('name="description"')) {
    html = html.replace(
      /<meta name="description" content="[^"]*"[^>]*>/g,
      `<meta name="description" content="${config.description}" />`
    );
  } else {
    html = html.replace(
      '</head>',
      `  <meta name="description" content="${config.description}">\n  </head>`
    );
  }

  // Replace or add keywords
  if (config.keywords) {
    if (html.includes('name="keywords"')) {
      html = html.replace(
        /<meta name="keywords" content=".*?">/,
        `<meta name="keywords" content="${config.keywords}">`
      );
    } else {
      html = html.replace(
        '</head>',
        `  <meta name="keywords" content="${config.keywords}">\n  </head>`
      );
    }
  }

  // Replace canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*"[^>]*>/g,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );

  // Replace robots
  html = html.replace(
    /<meta name="robots" content=".*?">/,
    `<meta name="robots" content="${config.robots}">`
  );

  // Replace OG tags
  html = html.replace(
    /<meta property="og:title" content=".*?">/,
    `<meta property="og:title" content="${config.title}">`
  );
  html = html.replace(
    /<meta property="og:description" content=".*?">/,
    `<meta property="og:description" content="${config.description}">`
  );
  html = html.replace(
    /<meta property="og:url" content=".*?">/,
    `<meta property="og:url" content="${canonicalUrl}">`
  );

  // Replace Twitter tags
  html = html.replace(
    /<meta name="twitter:title" content=".*?">/,
    `<meta name="twitter:title" content="${config.title}">`
  );
  html = html.replace(
    /<meta name="twitter:description" content=".*?">/,
    `<meta name="twitter:description" content="${config.description}">`
  );
  html = html.replace(
    /<meta name="twitter:url" content=".*?">/,
    `<meta name="twitter:url" content="${canonicalUrl}">`
  );

  return html;
}

/**
 * Main function
 */
function main() {

  const baseHTML = getBaseHTML();
  let processed = 0;

  for (const [route, config] of Object.entries(routeConfig)) {
    const routePath = route.slice(1); // Remove leading slash
    const dirPath = path.join(distDir, routePath);
    const filePath = path.join(dirPath, 'index.html');

    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Inject meta tags
    const html = injectMeta(baseHTML, route, config);

    // Write file
    fs.writeFileSync(filePath, html);
    processed++;
  }

    '\n📝 Note: These are static HTML shells. The React app will hydrate them on load.'
  );
}

// Run
try {
  main();
} catch (error) {
  process.exit(1);
}
