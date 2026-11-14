#!/usr/bin/env npx ts-node
/**
 * Stub / Placeholder / Fake Data Audit Script
 *
 * Scans codebase for:
 * - Placeholder text patterns
 * - Fake/sample data
 * - Coming soon content
 * - Hardcoded demo values
 *
 * Run: npx ts-node scripts/audit-stubs.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface AuditFinding {
  file: string;
  line: number;
  pattern: string;
  content: string;
  severity: 'critical' | 'warning' | 'info';
}

const findings: AuditFinding[] = [];

// Patterns to detect (case-insensitive)
const PLACEHOLDER_PATTERNS = [
  { pattern: /coming soon/i, severity: 'critical' as const, desc: 'Coming soon text' },
  { pattern: /lorem ipsum/i, severity: 'critical' as const, desc: 'Lorem ipsum' },
  { pattern: /placeholder/i, severity: 'critical' as const, desc: 'Placeholder text' },
  {
    pattern: /sample\s+(data|content|text|user)/i,
    severity: 'critical' as const,
    desc: 'Sample content',
  },
  {
    pattern: /example\s+(data|content|text|user)/i,
    severity: 'warning' as const,
    desc: 'Example content',
  },
  { pattern: /\bTBD\b/i, severity: 'warning' as const, desc: 'TBD marker' },
  { pattern: /\bTODO\b(?!:)/i, severity: 'info' as const, desc: 'TODO marker' },
  { pattern: /\bFIXME\b/i, severity: 'warning' as const, desc: 'FIXME marker' },
  { pattern: /demo\s+(mode|data|content)/i, severity: 'critical' as const, desc: 'Demo content' },
  { pattern: /test\s+(user|data|content)/i, severity: 'warning' as const, desc: 'Test content' },
  { pattern: /fake\s+(data|user|content)/i, severity: 'critical' as const, desc: 'Fake content' },
  { pattern: /john\s+doe/i, severity: 'warning' as const, desc: 'Fake name' },
  { pattern: /jane\s+doe/i, severity: 'warning' as const, desc: 'Fake name' },
  { pattern: /test@test\.com/i, severity: 'warning' as const, desc: 'Test email' },
  { pattern: /example@example\.com/i, severity: 'warning' as const, desc: 'Example email' },
  { pattern: /123-456-7890/i, severity: 'warning' as const, desc: 'Fake phone' },
  { pattern: /xxx+/i, severity: 'warning' as const, desc: 'XXX placeholder' },
  {
    pattern: /\.\.\.\s*$/m,
    severity: 'info' as const,
    desc: 'Trailing ellipsis (possible incomplete)',
  },
  {
    pattern: /insert\s+(here|text|content)/i,
    severity: 'critical' as const,
    desc: 'Insert placeholder',
  },
  {
    pattern: /your\s+(text|content|name)\s+here/i,
    severity: 'critical' as const,
    desc: 'Your X here placeholder',
  },
];

// Directories to scan
const SCAN_DIRS = ['app', 'components', 'lib'];

// Files to skip
const SKIP_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /dist/,
  /build/,
  /\.test\./,
  /\.spec\./,
  /test\//,
  /__tests__/,
  /scripts\/audit/, // Don't audit the audit scripts
  /seed/,
  /mock/,
];

// File extensions to scan
const SCAN_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.json', '.md'];

function shouldSkipFile(filePath: string): boolean {
  return SKIP_PATTERNS.some((pattern) => pattern.test(filePath));
}

function scanFile(filePath: string): void {
  if (shouldSkipFile(filePath)) return;

  const ext = path.extname(filePath);
  if (!SCAN_EXTENSIONS.includes(ext)) return;

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Skip comments in certain contexts
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('//') && trimmedLine.includes('TODO')) {
        // Allow TODO in comments for now
        return;
      }

      PLACEHOLDER_PATTERNS.forEach(({ pattern, severity, desc }) => {
        if (pattern.test(line)) {
          // Skip if it's in a variable name or function definition
          if (
            /^(const|let|var|function|export)\s+\w*(placeholder|sample|example)/i.test(trimmedLine)
          ) {
            return;
          }

          findings.push({
            file: filePath.replace(process.cwd(), ''),
            line: index + 1,
            pattern: desc,
            content: line.trim().substring(0, 100),
            severity,
          });
        }
      });
    });
  } catch (e) {
    // Skip files that can't be read
  }
}

function scanDirectory(dir: string): void {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (shouldSkipFile(fullPath)) continue;

      if (item.isDirectory()) {
        scanDirectory(fullPath);
      } else {
        scanFile(fullPath);
      }
    }
  } catch (e) {
    // Directory doesn't exist
  }
}

function runAudit() {
  console.log('🔍 Stub / Placeholder Audit\n');
  console.log('='.repeat(60));

  // Scan directories
  for (const dir of SCAN_DIRS) {
    const fullPath = path.join(process.cwd(), dir);
    console.log(`Scanning ${dir}/...`);
    scanDirectory(fullPath);
  }

  // Categorize findings
  const critical = findings.filter((f) => f.severity === 'critical');
  const warnings = findings.filter((f) => f.severity === 'warning');
  const info = findings.filter((f) => f.severity === 'info');

  // Report
  if (critical.length > 0) {
    console.log('\n❌ CRITICAL - Must fix before production');
    console.log('-'.repeat(40));
    for (const f of critical) {
      console.log(`  ${f.file}:${f.line}`);
      console.log(`    Pattern: ${f.pattern}`);
      console.log(`    Content: ${f.content}`);
      console.log('');
    }
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS - Review before production');
    console.log('-'.repeat(40));
    for (const f of warnings) {
      console.log(`  ${f.file}:${f.line} - ${f.pattern}`);
    }
  }

  if (info.length > 0) {
    console.log('\nℹ️  INFO - May need attention');
    console.log('-'.repeat(40));
    console.log(`  ${info.length} informational findings (run with --verbose to see)`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('-'.repeat(40));
  console.log(`  Critical: ${critical.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  console.log(`  Info: ${info.length}`);
  console.log(`  Total: ${findings.length}`);
  console.log('='.repeat(60));

  // Write JSON report
  const reportPath = path.join(process.cwd(), 'stub-audit-report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: {
          critical: critical.length,
          warnings: warnings.length,
          info: info.length,
          total: findings.length,
        },
        findings,
      },
      null,
      2,
    ),
  );
  console.log(`\n📄 Full report written to: ${reportPath}`);

  // Exit with error if critical findings
  if (critical.length > 0) {
    console.log(`\n❌ ${critical.length} critical issues found. Fix before production.`);
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} warnings found. Review recommended.`);
    process.exit(0);
  } else {
    console.log('\n✅ No critical stub/placeholder content found!');
    process.exit(0);
  }
}

runAudit();
