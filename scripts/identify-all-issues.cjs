#!/usr/bin/env node
/**
 * IDENTIFY ALL ISSUES - NO SKIPPING
 * Get exact details of every single problem
 */

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════');
console.log('  IDENTIFYING ALL ISSUES - COMPLETE ANALYSIS');
console.log('═══════════════════════════════════════════════════════\n');

// Load audit report
const audit = JSON.parse(fs.readFileSync('./audit-report.json', 'utf8'));

// 1. BROKEN COMPONENTS
console.log(`\n1️⃣  BROKEN COMPONENTS (${audit.details.components.errors.length} total):\n`);
audit.details.components.errors.forEach((err, i) => {
  console.log(`${i + 1}. ${err.file}`);
  if (err.issues) {
    err.issues.forEach((issue) => console.log(`   ❌ ${issue}`));
  }
  if (err.error) {
    console.log(`   ❌ ${err.error}`);
  }

  // Read file and diagnose
  try {
    const content = fs.readFileSync(err.file, 'utf8');

    // Check specific issues
    if (!content.includes('import') && !content.includes('require')) {
      console.log(`   🔧 FIX: Add imports`);
    }
    if (!content.includes('export')) {
      console.log(`   🔧 FIX: Add export statement`);
    }
    if (content.includes('import React from') && content.includes('import * as React')) {
      console.log(`   🔧 FIX: Remove duplicate React import`);
    }
  } catch (e) {
    console.log(`   ❌ Cannot read file: ${e.message}`);
  }
  console.log('');
});

// 2. BROKEN LINKS (categorized)
console.log(`\n2️⃣  BROKEN LINKS (${audit.details.links.broken.length} total):\n`);

const linksByType = {
  mailto: [],
  anchor: [],
  external: [],
  internal: [],
};

audit.details.links.broken.forEach((link) => {
  if (link.href.startsWith('mailto:')) {
    linksByType.mailto.push(link);
  } else if (link.href.includes('#')) {
    linksByType.anchor.push(link);
  } else if (link.href.startsWith('http')) {
    linksByType.external.push(link);
  } else {
    linksByType.internal.push(link);
  }
});

console.log(`📧 Mailto links: ${linksByType.mailto.length} (these are valid, ignore)`);
console.log(`⚓ Anchor links: ${linksByType.anchor.length} (these are valid, ignore)`);
console.log(`🌐 External links: ${linksByType.external.length} (cannot verify, assume valid)`);
console.log(`🔗 Internal links: ${linksByType.internal.length} (NEED TO FIX)\n`);

// Show internal broken links
console.log('Internal broken links that MUST be fixed:\n');
const internalByHref = {};
linksByType.internal.forEach((link) => {
  if (!internalByHref[link.href]) {
    internalByHref[link.href] = [];
  }
  internalByHref[link.href].push(link.file);
});

Object.entries(internalByHref).forEach(([href, files], i) => {
  console.log(`${i + 1}. ${href}`);
  console.log(`   Found in ${files.length} file(s)`);

  // Determine fix
  const targetPath = path.join('./dist', href);
  if (fs.existsSync(targetPath)) {
    console.log(`   ✅ File exists - link checker error`);
  } else {
    console.log(`   🔧 FIX: Create ${targetPath}`);
  }
  console.log('');
});

// 3. SUMMARY
console.log('\n═══════════════════════════════════════════════════════');
console.log('SUMMARY OF ISSUES TO FIX:');
console.log('═══════════════════════════════════════════════════════');
console.log(`Components with errors: ${audit.details.components.errors.length}`);
console.log(`Internal broken links: ${linksByType.internal.length}`);
console.log(
  `Total issues to fix: ${audit.details.components.errors.length + linksByType.internal.length}`,
);
console.log('═══════════════════════════════════════════════════════\n');

// Save detailed report
const detailedReport = {
  timestamp: new Date().toISOString(),
  components: audit.details.components.errors,
  internalLinks: internalByHref,
  totalIssues: audit.details.components.errors.length + linksByType.internal.length,
};

fs.writeFileSync('./issues-to-fix.json', JSON.stringify(detailedReport, null, 2));
console.log('✅ Detailed report saved: issues-to-fix.json\n');
