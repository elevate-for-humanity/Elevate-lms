#!/usr/bin/env npx tsx
/**
 * Batch fix missing canonical URLs in marketing pages
 */

import * as fs from 'fs';
import * as path from 'path';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const SITE_URL = 'https://www.elevateforhumanity.org';

function getRouteFromPath(filePath: string): string {
  const match = filePath.match(/app\/(.*)\/page\.tsx$/);
  if (match) {
    return '/' + match[1];
  }
  if (filePath === 'app/page.tsx') {
    return '/';
  }
  return filePath;
}

function fixPage(filePath: string): { fixed: boolean; action: string } {
  const fullPath = path.join(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, 'utf-8');
  const route = getRouteFromPath(filePath);

  // Skip if already has canonical
  if (content.includes('canonical') || content.includes('alternates')) {
    return { fixed: false, action: 'already has canonical' };
  }

  // Skip client components - they need layout.tsx instead
  if (content.startsWith("'use client'") || content.startsWith('"use client"')) {
    // Check if layout.tsx exists
    const dir = path.dirname(fullPath);
    const layoutPath = path.join(dir, 'layout.tsx');
    if (fs.existsSync(layoutPath)) {
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      if (layoutContent.includes('canonical') || layoutContent.includes('alternates')) {
        return { fixed: false, action: 'canonical in layout.tsx' };
      }
    }
    return { fixed: false, action: 'client component - needs layout.tsx' };
  }

  // Check if has metadata export
  if (
    !content.includes('export const metadata') &&
    !content.includes('export async function generateMetadata')
  ) {
    // Need to add full metadata
    const metadataImport = "import { Metadata } from 'next';\n";
    const routeName =
      route
        .replace(/^\//, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()) || 'Home';
    const metadata = `
export const metadata: Metadata = {
  title: '${routeName} | ' + PLATFORM_DEFAULTS.orgName + '',
  description: 'Elevate for Humanity - Career training and workforce development programs.',
  alternates: {
    canonical: '${SITE_URL}${route}',
  },
};
`;

    // Add import if not present
    if (!content.includes('import { Metadata }') && !content.includes('import type { Metadata }')) {
      // Find first import and add after
      const firstImportMatch = content.match(/^import .+$/m);
      if (firstImportMatch) {
        content = content.replace(firstImportMatch[0], metadataImport + firstImportMatch[0]);
      } else {
        content = metadataImport + content;
      }
    }

    // Add metadata before export default
    const exportMatch = content.match(/export (default |async )?function/);
    if (exportMatch) {
      content = content.replace(exportMatch[0], metadata + '\n' + exportMatch[0]);
    }

    fs.writeFileSync(fullPath, content);
    return { fixed: true, action: 'added full metadata with canonical' };
  }

  // Has metadata but missing canonical - add alternates
  const metadataMatch = content.match(/export const metadata:\s*Metadata\s*=\s*\{/);
  if (metadataMatch) {
    // Find the closing of the metadata object and add alternates before it
    // This is tricky - let's find the pattern and add alternates

    // Simple approach: add alternates after description if present
    const descMatch = content.match(/(description:\s*['"`][^'"`]*['"`],?\n)/);
    if (descMatch) {
      const alternates = `  alternates: {\n    canonical: '${SITE_URL}${route}',\n  },\n`;
      content = content.replace(descMatch[0], descMatch[0] + alternates);
      fs.writeFileSync(fullPath, content);
      return { fixed: true, action: 'added alternates to existing metadata' };
    }

    // Try after title
    const titleMatch = content.match(/(title:\s*['"`][^'"`]*['"`],?\n)/);
    if (titleMatch) {
      const alternates = `  alternates: {\n    canonical: '${SITE_URL}${route}',\n  },\n`;
      content = content.replace(titleMatch[0], titleMatch[0] + alternates);
      fs.writeFileSync(fullPath, content);
      return { fixed: true, action: 'added alternates after title' };
    }
  }

  return { fixed: false, action: 'could not determine where to add canonical' };
}

function main() {
  const report = JSON.parse(fs.readFileSync('marketing-audit-report.json', 'utf-8'));

  console.log('\n🔧 FIXING MISSING CANONICAL URLs\n');
  console.log('='.repeat(60));

  let fixed = 0;
  let skipped = 0;
  let needsManual: string[] = [];

  for (const result of report.results) {
    if (!result.issues.includes('Missing canonical URL')) {
      continue;
    }

    try {
      const { fixed: wasFixed, action } = fixPage(result.page);
      if (wasFixed) {
        console.log(`✅ ${result.route} - ${action}`);
        fixed++;
      } else {
        if (action.includes('client component')) {
          needsManual.push(`${result.route} (${action})`);
        }
        skipped++;
      }
    } catch (err) {
      console.error(`❌ ${result.route} - Error: ${err}`);
      needsManual.push(`${result.route} (error)`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 SUMMARY`);
  console.log(`   Fixed: ${fixed}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Needs manual: ${needsManual.length}`);

  if (needsManual.length > 0) {
    console.log('\n📝 NEEDS MANUAL FIX (client components need layout.tsx):');
    for (const page of needsManual) {
      console.log(`   - ${page}`);
    }
  }
}

main();
