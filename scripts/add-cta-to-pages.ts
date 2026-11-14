#!/usr/bin/env npx tsx
/**
 * Add CTA sections to pages that are missing them
 */

import * as fs from 'fs';
import * as path from 'path';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const CTA_SECTION = `
      {/* CTA Section */}
      <section className="bg-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-blue-100 mb-6">Apply today for free career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-white text-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="tel:317-314-3757"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              ${PLATFORM_DEFAULTS.supportPhone}
            </a>
          </div>
        </div>
      </section>`;

const PHONE_IMPORT = `, Phone';

// Pages that should NOT get a CTA (internal/utility pages)
const SKIP_PAGES = [
  'access-paused',
  'cache-diagnostic',
  'metrics',
  'pwa',
  'reset',
  'test-images',
  'program-holder', // internal dashboard
  'instructor', // internal dashboard
  'suboffice-onboarding', // internal
];

function addCTAToPage(filePath: string): { success: boolean; reason: string } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const pageName = path.basename(path.dirname(filePath));

  // Skip certain pages
  if (SKIP_PAGES.includes(pageName)) {
    return { success: false, reason: 'skipped (internal page)' };
  }

  // Skip if already has CTA
  if (
    content.includes('href="/apply"') ||
    content.includes('href="/contact"') ||
    content.includes('tel:')
  ) {
    return { success: false, reason: 'already has CTA' };
  }

  // Skip redirect pages
  if (content.includes('redirect(')) {
    return { success: false, reason: 'redirect page' };
  }

  // Skip client components for now (more complex to modify)
  if (content.startsWith("'use client'") || content.startsWith('"use client"')) {
    // Check if it has a simple return structure we can modify
    if (!content.includes('return (')) {
      return { success: false, reason: 'complex client component' };
    }
  }

  // Find the last closing </div> before the final );
  // This is where we'll insert the CTA

  // Add Phone import if not present
  let newContent = content;
  if (!content.includes('Phone')) {
    // Try to add to lucide-react import
    const lucideMatch = content.match(/(import\s*\{[^}]*)\}\s*from\s*['"]lucide-react['"]/);
    if (lucideMatch) {
      newContent = newContent.replace(
        lucideMatch[0],
        lucideMatch[1] + PHONE_IMPORT + "} from 'lucide-react'",
      );
    } else {
      // Add new import
      const firstImport = newContent.match(/^import .+$/m);
      if (firstImport) {
        newContent = newContent.replace(
          firstImport[0],
          firstImport[0] + "\nimport { Phone } from 'lucide-react';",
        );
      }
    }
  }

  // Add Link import if not present
  if (!content.includes("from 'next/link'") && !content.includes('from "next/link"')) {
    const firstImport = newContent.match(/^import .+$/m);
    if (firstImport) {
      newContent = newContent.replace(
        firstImport[0],
        firstImport[0] + "\nimport Link from 'next/link';",
      );
    }
  }

  // Find the pattern: </div>\n    </div>\n  );\n}
  // and insert CTA before the last </div>
  const endPattern = /(\s*<\/div>\s*\n\s*<\/div>\s*\n\s*\);\s*\n\})/;
  const match = newContent.match(endPattern);

  if (match) {
    newContent = newContent.replace(endPattern, CTA_SECTION + match[1]);
    fs.writeFileSync(filePath, newContent);
    return { success: true, reason: 'added CTA' };
  }

  // Try alternate pattern for simpler pages
  const simpleEndPattern = /(\s*<\/div>\s*\n\s*\);\s*\n\})/;
  const simpleMatch = newContent.match(simpleEndPattern);

  if (simpleMatch) {
    newContent = newContent.replace(simpleEndPattern, CTA_SECTION + simpleMatch[1]);
    fs.writeFileSync(filePath, newContent);
    return { success: true, reason: 'added CTA (simple)' };
  }

  return { success: false, reason: 'could not find insertion point' };
}

function main() {
  const report = JSON.parse(fs.readFileSync('marketing-audit-report.json', 'utf-8'));

  console.log('\n🔧 ADDING CTAs TO PAGES\n');
  console.log('='.repeat(60));

  let added = 0;
  let skipped = 0;
  const failed: string[] = [];

  for (const result of report.results) {
    if (!result.issues.includes('Missing call-to-action')) {
      continue;
    }

    try {
      const { success, reason } = addCTAToPage(result.page);
      if (success) {
        console.log(`✅ ${result.route} - ${reason}`);
        added++;
      } else {
        console.log(`⏭️  ${result.route} - ${reason}`);
        skipped++;
      }
    } catch (err) {
      console.error(`❌ ${result.route} - Error: ${err}`);
      failed.push(result.route);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 SUMMARY`);
  console.log(`   Added: ${added}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\n❌ FAILED:');
    for (const page of failed) {
      console.log(`   - ${page}`);
    }
  }
}

main();
