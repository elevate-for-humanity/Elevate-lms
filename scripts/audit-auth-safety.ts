#!/usr/bin/env npx ts-node
/**
 * Auth Safety Audit Script
 * 
 * Scans all pages for unsafe user access patterns.
 * Produces a report of files that need fixes.
 */

import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const APPS_DIR = join(__dirname, '..', 'apps');

interface AuditResult {
  file: string;
  issues: Issue[];
  status: 'safe' | 'needs-review' | 'unsafe';
}

interface Issue {
  line: number;
  pattern: string;
  code: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
}

function scanFile(filePath: string): AuditResult {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues: Issue[] = [];
  
  // Patterns that indicate unsafe access
  const unsafePatterns = [
    {
      regex: /user\.id(?!\s*\?)/g,
      pattern: 'user.id without null check',
      risk: 'HIGH' as const
    },
    {
      regex: /user\.email(?!\s*\?)/g,
      pattern: 'user.email without null check',
      risk: 'HIGH' as const
    },
    {
      regex: /\.eq\(['"]id['"],\s*user\.id\)/g,
      pattern: 'Direct user.id in query without guard',
      risk: 'HIGH' as const
    }
  ];
  
  // Safe patterns that should NOT be flagged
  const safePatterns = [
    /if\s*\(\s*!user\s*\)/,
    /if\s*\(\s*user\s*&&/,
    /if\s*\(\s*user\?\./,
    /user\?\./,
    /user\?\?/,
    /guardUser/,
    /requireAuth/,
    /requireUser/,
    /getUserId/,
    /requireUserId/,
  ];
  
  let getUserFound = false;
  let hasUserGuard = false;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Track if getUser is found
    if (line.includes('getUser()')) {
      getUserFound = true;
    }
    
    // Check for user guards
    if (safePatterns.some(p => p.test(line))) {
      hasUserGuard = true;
    }
    
    // Check for unsafe patterns
    for (const { regex, pattern, risk } of unsafePatterns) {
      if (regex.test(line)) {
        // Check if this line has a guard
        const hasGuard = safePatterns.some(p => p.test(line));
        if (!hasGuard && getUserFound && !hasUserGuard) {
          issues.push({ line: lineNum, pattern, code: line.trim(), risk });
        }
      }
    }
  });
  
  // Also flag files that have getUser but no guard at all
  if (getUserFound && !hasUserGuard && issues.length === 0) {
    issues.push({
      line: 1,
      pattern: 'getUser() without null guard',
      code: 'File calls getUser() but may not guard against null user',
      risk: 'MEDIUM'
    });
  }
  
  return {
    file: filePath.replace(__dirname + '/../', ''),
    issues,
    status: issues.length === 0 ? 'safe' : issues.some(i => i.risk === 'HIGH') ? 'unsafe' : 'needs-review'
  };
}

function scanDirectory(dir: string, results: AuditResult[] = []): void {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip certain directories
        if (['node_modules', '.next', '.git', '__tests__', 'tests'].includes(entry.name)) {
          continue;
        }
        scanDirectory(fullPath, results);
      } else if (extname(entry.name) === '.tsx' || extname(entry.name) === '.ts') {
        const result = scanFile(fullPath);
        if (result.issues.length > 0) {
          results.push(result);
        }
      }
    }
  } catch (e) {
    // Ignore permission errors
  }
}

// Run audit
const results: AuditResult[] = [];
scanDirectory(join(APPS_DIR, 'admin', 'app', 'admin'), results);
scanDirectory(join(APPS_DIR, 'app'), results);

// Sort by status (unsafe first)
results.sort((a, b) => {
  const order = { unsafe: 0, 'needs-review': 1, safe: 2 };
  return order[a.status] - order[b.status];
});

// Output report
console.log('# Auth Safety Audit Report\n');
console.log(`Generated: ${new Date().toISOString()}\n`);

console.log('## Summary\n');
const unsafeCount = results.filter(r => r.status === 'unsafe').length;
const needsReviewCount = results.filter(r => r.status === 'needs-review').length;
const safeCount = results.filter(r => r.status === 'safe').length;

console.log(`| Status | Count |`);
console.log(`|--------|-------|`);
console.log(`| 🔴 Unsafe | ${unsafeCount} |`);
console.log(`| 🟡 Needs Review | ${needsReviewCount} |`);
console.log(`| 🟢 Safe | ${results.length} |`);

if (unsafeCount > 0 || needsReviewCount > 0) {
  console.log('\n## Files Requiring Attention\n');
  
  for (const result of results) {
    if (result.status === 'safe') continue;
    
    console.log(`\n### ${result.file}\n`);
    console.log(`**Status**: ${result.status === 'unsafe' ? '🔴 UNSAFE' : '🟡 NEEDS REVIEW'}\n`);
    
    for (const issue of result.issues) {
      console.log(`Line ${issue.line} - ${issue.risk} Risk: ${issue.pattern}`);
      console.log('```');
      console.log(issue.code);
      console.log('```\n');
    }
  }
  
  console.log('\n## Recommended Fix\n');
  console.log('Add null guard after getUser():\n');
  console.log('```typescript');
  console.log('const { data: { user } } = await supabase.auth.getUser();');
  console.log('');
  console.log('// Add this guard:');
  console.log('if (!user) {');
  console.log("  redirect('/login');");
  console.log('}');
  console.log('```');
} else {
  console.log('\n✅ All scanned files are safe!');
}

// Exit with error code if issues found
process.exit(unsafeCount > 0 ? 1 : 0);
