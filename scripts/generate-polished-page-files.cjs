#!/usr/bin/env node

/**
 * scripts/generate-polished-page-files.cjs
 *
 * Usage from repo root (Gitpod):
 *   node scripts/generate-polished-page-files.cjs
 *
 * Requirements:
 *   - config/site-map.auto.ts exists and exports siteMapSections
 *   - components/layouts/AutoPolishedPage.tsx exists
 */

const fs = require('fs');
const path = require('path');

// We need to read the TypeScript file - parse it directly
function main() {
  const APP_DIR = path.join(process.cwd(), 'app');

  // Read and parse the site map file
  const siteMapPath = path.join(process.cwd(), 'config', 'site-map.auto.ts');
  const siteMapContent = fs.readFileSync(siteMapPath, 'utf8');

  // Extract siteMapSections using regex (simple approach)
  const match = siteMapContent.match(/export const siteMapSections[^=]*=\s*(\[[\s\S]*?\n\];)/);
  if (!match) {
    throw new Error('Could not parse siteMapSections from site-map.auto.ts');
  }

  // Use eval to parse the array (safe since we control the file)
  const siteMapSections = eval(match[1]);

  function routeToAppPath(route) {
    // "/" -> app/page.tsx
    if (route === '/') {
      return path.join(APP_DIR, 'page.tsx');
    }

    // "/about" -> app/about/page.tsx
    // "/student/dashboard" -> app/student/dashboard/page.tsx
    const segments = route.split('/').filter(Boolean);
    return path.join(APP_DIR, ...segments, 'page.tsx');
  }

  function ensureDirForFile(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  function makePageContent(route, label, sectionTitle) {
    const safeLabel = label.replace(/"/g, '\\"');

    // Basic metadata title/description
    const title = `${safeLabel} | Elevate For Humanity`;
    const description = `Learn more about ${safeLabel} inside the Elevate For Humanity workforce ecosystem.`;

    return `import type { Metadata } from "next";
import { AutoPolishedPage } from "@/components/layouts/AutoPolishedPage";

export const metadata: Metadata = {
  title: "${title}",
  description: "${description}",
};

export default function Page() {
  return (
    <AutoPolishedPage
      route="${route}"
      label="${safeLabel}"
      section="${sectionTitle}"
    />
  );
}
`;
  }

  console.log('🔍 Generating polished page files for all sitemap entries...\n');

  let total = 0;
  let skipped = 0;

  for (const section of siteMapSections) {
    for (const item of section.items) {
      // Only handle internal routes (start with "/")
      if (!item.href.startsWith('/')) {
        skipped++;
        continue;
      }

      const route = item.href;
      const label = item.label || route;
      const sectionTitle = section.title;

      const filePath = routeToAppPath(route);

      // Skip if this is a special page we want to keep custom
      const skipPages = [
        path.join(APP_DIR, 'page.tsx'), // home
        path.join(APP_DIR, 'programs', 'page.tsx'), // programs overview
        path.join(APP_DIR, 'programs', 'medical-assistant', 'page.tsx'),
        path.join(APP_DIR, 'programs', 'cna', 'page.tsx'),
        path.join(APP_DIR, 'sitemap-page', 'page.tsx'),
      ];

      if (skipPages.includes(filePath)) {
        console.log('⏭️  Skipping (custom page):', path.relative(process.cwd(), filePath));
        skipped++;
        continue;
      }

      ensureDirForFile(filePath);

      const content = makePageContent(route, label, sectionTitle);
      fs.writeFileSync(filePath, content, 'utf8');
      total++;

      console.log('✅ Wrote', path.relative(process.cwd(), filePath));
    }
  }

  console.log(`\n✨ Done. Generated/overwrote ${total} page files using AutoPolishedPage.`);
  console.log(`⏭️  Skipped ${skipped} pages (custom or external links).`);
  console.log('   Review with `git diff`, then run `npm run build` to confirm.');
}

try {
  main();
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
