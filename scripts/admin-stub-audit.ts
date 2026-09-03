#!/usr/bin/env npx tsx

/**
 * Admin Stub Page Audit Script
 * Identifies all stub/placeholder pages in the admin app
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

const ADMIN_APP_PATH = './apps/admin/app';

interface StubPage {
  path: string;
  type: 'Coming Soon' | 'Back to Home' | 'placeholder' | 'stub' | 'Lorem ipsum';
  lines: number;
  category: string;
}

const stubPatterns = [
  { pattern: /Coming Soon/i, type: 'Coming Soon' as const },
  { pattern: /Back to Home/i, type: 'Back to Home' as const },
  { pattern: /placeholder|stub/i, type: 'placeholder' as const },
  { pattern: /Lorem ipsum/i, type: 'Lorem ipsum' as const },
];

function scanDirectory(dir: string, category: string = ''): StubPage[] {
  const stubs: StubPage[] = [];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Check if it's a route segment
        if (entry !== 'node_modules' && !entry.startsWith('.')) {
          const pageFile = join(fullPath, 'page.tsx');
          const layoutFile = join(fullPath, 'layout.tsx');
          
          // Check for stub in page.tsx
          try {
            const content = readFileSync(pageFile, 'utf-8');
            const pageCategory = category || basename(dir);
            
            for (const { pattern, type } of stubPatterns) {
              if (pattern.test(content)) {
                const lines = content.split('\n').length;
                stubs.push({
                  path: pageFile.replace('./', ''),
                  type,
                  lines,
                  category: pageCategory,
                });
                break;
              }
            }
          } catch {
            // No page.tsx in this directory
          }
          
          // Recurse
          stubs.push(...scanDirectory(fullPath, category || basename(dir)));
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error);
  }
  
  return stubs;
}

// Run scan
console.log('🔍 Scanning admin app for stub pages...\n');
const stubs = scanDirectory(ADMIN_APP_PATH);

// Remove duplicates (same path might be found multiple times)
const uniqueStubs = stubs.filter((stub, index, self) => 
  index === self.findIndex(s => s.path === stub.path)
);

// Group by category
const byCategory = uniqueStubs.reduce((acc, stub) => {
  if (!acc[stub.category]) acc[stub.category] = [];
  acc[stub.category].push(stub);
  return acc;
}, {} as Record<string, StubPage[]>);

// Print report
console.log('📊 ADMIN STUB PAGE AUDIT REPORT\n');
console.log(`Total Stub Pages: ${uniqueStubs.length}\n`);

for (const [category, pages] of Object.entries(byCategory)) {
  console.log(`\n📁 ${category} (${pages.length} stubs):`);
  for (const page of pages) {
    console.log(`   • ${page.path.replace('apps/admin/app/', '/')}`);
    console.log(`     Type: ${page.type} | Lines: ${page.lines}`);
  }
}

// Generate CSV
console.log('\n\n📄 CSV Export:');
console.log('Path,Type,Category,Lines');
for (const stub of uniqueStubs) {
  console.log(`"${stub.path}","${stub.type}","${stub.category}",${stub.lines}`);
}

// Generate Markdown table
console.log('\n\n📋 Markdown Table:');
console.log('| Path | Type | Category | Lines |');
console.log('|------|------|----------|-------|');
for (const stub of uniqueStubs) {
  console.log(`| ${stub.path.replace('apps/admin/app/', '')} | ${stub.type} | ${stub.category} | ${stub.lines} |`);
}
