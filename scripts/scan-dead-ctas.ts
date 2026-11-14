#!/usr/bin/env npx tsx
/**
 * Dead CTA scanner.
 * Finds href="#", onClick={() => {}}, disabled buttons, TODO comments, empty routes.
 * Outputs reports/dead-cta-audit.json with file/line locations.
 */

import * as fs from 'fs';
import * as path from 'path';

const SCAN_DIRS = ['app', 'components'];
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.test\./,
  /\.spec\./,
  /__tests__/,
  /\.stories\./,
  /storybook/i,
  /\/demo\//i, // Demo pages are acceptable
  /\/api\//i, // API routes don't have CTAs
  /\.backup\./i, // Backup files
  /data\/programs\.ts$/, // Program data descriptions
];

const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Patterns that indicate dead CTAs (only check actual UI elements)
const DEAD_CTA_PATTERNS = [
  {
    pattern: /href\s*=\s*["']#["']/g,
    type: 'DEAD_LINK',
    description: 'href="#" - link goes nowhere',
  },
  {
    pattern: /href\s*=\s*["']['"](?!\s*\+)/g,
    type: 'EMPTY_HREF',
    description: 'Empty href attribute',
  },
  {
    pattern: /onClick\s*=\s*\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/g,
    type: 'EMPTY_HANDLER',
    description: 'Empty onClick handler',
  },
  {
    pattern: /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*null\s*\}/g,
    type: 'NULL_HANDLER',
    description: 'onClick returns null',
  },
  {
    pattern: /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*undefined\s*\}/g,
    type: 'UNDEFINED_HANDLER',
    description: 'onClick returns undefined',
  },
  {
    pattern: /href\s*=\s*["']\/coming-soon["']/g,
    type: 'COMING_SOON_ROUTE',
    description: 'Links to coming-soon page',
  },
  {
    pattern: /href\s*=\s*["']\/placeholder["']/g,
    type: 'PLACEHOLDER_ROUTE',
    description: 'Links to placeholder page',
  },
];

// False positive patterns to exclude
const FALSE_POSITIVE_PATTERNS = [
  /disabled\s*=\s*\{[^}]+loading/i, // disabled={loading} is OK
  /disabled\s*=\s*\{[^}]+isSubmitting/i, // disabled={isSubmitting} is OK
  /disabled\s*=\s*\{[^}]+pending/i, // disabled={pending} is OK
  /disabled\s*=\s*\{[^}]+disabled/i, // disabled={disabled} prop is OK
  /disabled\s*=\s*\{[^}]+!/i, // disabled={!something} is conditional
  /disabled\s*=\s*\{[^}]+&&/i, // disabled={x && y} is conditional
  /disabled\s*=\s*\{[^}]+\|\|/i, // disabled={x || y} is conditional
  /disabled\s*=\s*\{[^}]+\?/i, // disabled={x ? y : z} is conditional
  /href\s*=\s*["']#[a-zA-Z]/g, // href="#section" anchor links are OK
];

interface DeadCTAHit {
  file: string;
  line: number;
  column: number;
  type: string;
  description: string;
  context: string;
  action: 'IMPLEMENT_ROUTE' | 'REMOVE_BUTTON' | 'FIX_HANDLER' | 'RESOLVE_TODO';
}

function shouldExclude(filePath: string): boolean {
  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function isFalsePositive(line: string): boolean {
  return FALSE_POSITIVE_PATTERNS.some((pattern) => pattern.test(line));
}

function determineAction(
  type: string,
): 'IMPLEMENT_ROUTE' | 'REMOVE_BUTTON' | 'FIX_HANDLER' | 'RESOLVE_TODO' {
  switch (type) {
    case 'DEAD_LINK':
    case 'EMPTY_HREF':
    case 'COMING_SOON_ROUTE':
    case 'PLACEHOLDER_ROUTE':
      return 'IMPLEMENT_ROUTE';
    case 'DISABLED_BUTTON':
      return 'REMOVE_BUTTON';
    case 'EMPTY_HANDLER':
    case 'NULL_HANDLER':
    case 'UNDEFINED_HANDLER':
      return 'FIX_HANDLER';
    case 'TODO_COMMENT':
      return 'RESOLVE_TODO';
    default:
      return 'FIX_HANDLER';
  }
}

function scanFile(filePath: string): DeadCTAHit[] {
  const hits: DeadCTAHit[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, lineIndex) => {
    // Skip if line matches false positive patterns
    if (isFalsePositive(line)) return;

    for (const { pattern, type, description } of DEAD_CTA_PATTERNS) {
      // Reset regex lastIndex
      pattern.lastIndex = 0;

      let match;
      while ((match = pattern.exec(line)) !== null) {
        // Double-check for false positives on this specific match
        const matchContext = line.substring(
          Math.max(0, match.index - 20),
          match.index + match[0].length + 20,
        );
        if (isFalsePositive(matchContext)) continue;

        // Skip anchor links (href="#section-name")
        if (type === 'DEAD_LINK' && /href\s*=\s*["']#[a-zA-Z]/.test(line)) continue;

        hits.push({
          file: filePath,
          line: lineIndex + 1,
          column: match.index + 1,
          type,
          description,
          context: line.trim().substring(0, 120),
          action: determineAction(type),
        });
      }
    }
  });

  return hits;
}

function walkDir(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (shouldExclude(fullPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.isFile() && FILE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

function main() {
  const rootDir = process.cwd();
  const allHits: DeadCTAHit[] = [];

  for (const scanDir of SCAN_DIRS) {
    const dirPath = path.join(rootDir, scanDir);
    const files = walkDir(dirPath);

    for (const file of files) {
      const relativePath = path.relative(rootDir, file);
      const hits = scanFile(file).map((h) => ({ ...h, file: relativePath }));
      allHits.push(...hits);
    }
  }

  // Sort by file, then line
  allHits.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.line - b.line;
  });

  const report = {
    generated: new Date().toISOString(),
    totalHits: allHits.length,
    byType: {
      DEAD_LINK: allHits.filter((h) => h.type === 'DEAD_LINK').length,
      EMPTY_HREF: allHits.filter((h) => h.type === 'EMPTY_HREF').length,
      EMPTY_HANDLER: allHits.filter((h) => h.type === 'EMPTY_HANDLER').length,
      NULL_HANDLER: allHits.filter((h) => h.type === 'NULL_HANDLER').length,
      DISABLED_BUTTON: allHits.filter((h) => h.type === 'DISABLED_BUTTON').length,
      TODO_COMMENT: allHits.filter((h) => h.type === 'TODO_COMMENT').length,
      COMING_SOON_ROUTE: allHits.filter((h) => h.type === 'COMING_SOON_ROUTE').length,
    },
    byAction: {
      IMPLEMENT_ROUTE: allHits.filter((h) => h.action === 'IMPLEMENT_ROUTE').length,
      REMOVE_BUTTON: allHits.filter((h) => h.action === 'REMOVE_BUTTON').length,
      FIX_HANDLER: allHits.filter((h) => h.action === 'FIX_HANDLER').length,
      RESOLVE_TODO: allHits.filter((h) => h.action === 'RESOLVE_TODO').length,
    },
    hits: allHits,
  };

  const outputPath = path.join(rootDir, 'reports', 'dead-cta-audit.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log(`Scan complete: ${allHits.length} dead CTAs found`);
  console.log('\nBy type:');
  Object.entries(report.byType).forEach(([type, count]) => {
    if (count > 0) console.log(`  ${type}: ${count}`);
  });
  console.log('\nBy action needed:');
  Object.entries(report.byAction).forEach(([action, count]) => {
    if (count > 0) console.log(`  ${action}: ${count}`);
  });
  console.log(`\nReport written to: ${outputPath}`);

  // Print first 15 hits for review
  if (allHits.length > 0) {
    console.log('\nFirst 15 hits:');
    allHits.slice(0, 15).forEach((h) => {
      console.log(`  ${h.file}:${h.line} [${h.type}] → ${h.action}`);
      console.log(`    ${h.context.substring(0, 80)}`);
    });
  }

  // Exit with error if hits found (for CI)
  if (allHits.length > 0) {
    process.exit(1);
  }
}

main();
