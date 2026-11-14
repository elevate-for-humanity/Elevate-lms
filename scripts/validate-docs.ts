#!/usr/bin/env tsx
/**
 * Documentation Validation
 * Checks documentation files for encoding artifacts and completeness
 */

import fs from 'fs';
import path from 'path';

const DOCS_TO_CHECK = [
  'README.md',
  'CODEBASE_ANALYSIS.md',
  'docs/USER_FLOWS.md',
  'docs/ARCHITECTURE.md',
  'docs/API_DOCUMENTATION.md',
  'docs/SETUP.md',
];

const ENCODING_ARTIFACTS = ['\\u0026', '\\u003c', '\\u003e', '&amp;', '&lt;', '&gt;'];

console.log('🔍 Validating documentation files...\n');

let hasErrors = false;
const issues: string[] = [];

for (const docPath of DOCS_TO_CHECK) {
  const fullPath = path.join(process.cwd(), docPath);

  if (!fs.existsSync(fullPath)) {
    issues.push(`❌ Missing: ${docPath}`);
    hasErrors = true;
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');

  // Check for encoding artifacts
  for (const artifact of ENCODING_ARTIFACTS) {
    if (content.includes(artifact)) {
      issues.push(`⚠️  Encoding artifact "${artifact}" found in ${docPath}`);
    }
  }

  // Check for minimum content length
  if (content.length < 100) {
    issues.push(`⚠️  ${docPath} seems too short (${content.length} chars)`);
  }

  // Check for TODO markers
  const todoMatches = content.match(/TODO|FIXME|XXX/gi);
  if (todoMatches && todoMatches.length > 0) {
    issues.push(`⚠️  ${docPath} contains ${todoMatches.length} TODO/FIXME markers`);
  }
}

// Report results
if (issues.length === 0) {
  console.log('✅ All documentation files validated successfully');
  console.log(`   Checked ${DOCS_TO_CHECK.length} files\n`);
  process.exit(0);
} else {
  console.log('Issues found:\n');
  issues.forEach((issue) => console.log(`   ${issue}`));
  console.log();

  if (hasErrors) {
    console.log('❌ Documentation validation FAILED\n');
    process.exit(1);
  } else {
    console.log('⚠️  Documentation validation passed with warnings\n');
    process.exit(0);
  }
}
