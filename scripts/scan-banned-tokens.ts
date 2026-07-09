#!/usr/bin/env npx tsx
/**
 * Repo-wide banned token scanner.
 * Scans app/, components/, content/, lib/ for placeholder/stub content.
 * Outputs reports/stub-audit-code.json with file/line/token locations.
 */

import * as fs from 'fs';
import * as path from 'path';

// Tokens that ALWAYS indicate stub/placeholder content
const BANNED_TOKENS = ['coming soon', 'lorem ipsum', 'lorem', 'tbd'];

// These need context-aware detection (only flag in user-facing string literals)
const CONTEXT_SENSITIVE_TOKENS = [
  'sample data',
  'example data',
  'placeholder text',
  'fake data',
  'test data',
];

const SCAN_DIRS = ['app', 'components', 'content', 'lib'];
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.test\./,
  /\.spec\./,
  /__tests__/,
  /\.stories\./,
  /storybook/i,
  /scripts\/.*\.ts$/, // Exclude audit scripts themselves
  /banned-tokens\.ts$/, // Exclude the token list itself
  /scan-banned-tokens\.ts$/,
  /audit-stubs\.ts$/,
  /archetypes\.ts$/, // Validation lists that define forbidden phrases
  /content\/archetypes\.ts$/,
  /api\/trap/, // Honeypot for scrapers
  /api\/test-/, // Test endpoints
  /api\/simulate/, // Simulation endpoints
  /store\/demo/, // Demo pages are legitimate
  /avatar-scripts\.ts$/, // Avatar scripts for demos
];

// Patterns that are false positives
const FALSE_POSITIVE_PATTERNS = [
  /placeholder-gray/i, // Tailwind class
  /placeholder-\w+/i, // Tailwind placeholder color classes
  /placeholder="/i, // HTML placeholder attribute
  /placeholder='/i,
  /placeholder={/i, // React placeholder prop
  /toLocaleDateString/i, // Contains "test"
  /toLocaleString/i,
  /latest/i, // Contains "test"
  /fastest/i,
  /greatest/i,
  /contest/i,
  /protest/i,
  /attest/i,
  /detest/i,
  /testimony/i,
  /testimonial/i,
  /intestin/i,
  /::placeholder/i, // CSS pseudo-element
  /&::placeholder/i,
  /for example/i, // Explanatory text is OK
  /example:/i, // Code comments explaining
  /\/\/ example/i,
  /\/\* example/i,
  /demo mode/i, // Feature flag names are OK in code
  /isDemoMode/i,
  /demoMode/i,
  /DEMO_/i, // Environment variable names
  /sample_rate/i, // Technical terms
  /sampleRate/i,
  /downsample/i,
  /upsample/i,
  /resample/i,
];

const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.md', '.mdx'];

interface TokenHit {
  file: string;
  line: number;
  column: number;
  token: string;
  context: string;
  classification: 'IMPLEMENT' | 'REMOVE' | 'FIX_COPY';
}

function shouldExclude(filePath: string): boolean {
  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function isFalsePositive(line: string, token: string): boolean {
  // Check against false positive patterns
  if (FALSE_POSITIVE_PATTERNS.some((pattern) => pattern.test(line))) {
    return true;
  }

  // "test" is almost always a false positive unless it's "test data" or "test content"
  if (token === 'test') {
    const lowerLine = line.toLowerCase();
    if (
      !lowerLine.includes('test data') &&
      !lowerLine.includes('test content') &&
      !lowerLine.includes('test user') &&
      !lowerLine.includes('"test"') &&
      !lowerLine.includes("'test'")
    ) {
      return true;
    }
  }

  return false;
}

function isInUserFacingString(line: string, matchIndex: number, token: string): boolean {
  // Check if the token appears in a string literal that would be user-facing
  const beforeMatch = line.substring(0, matchIndex);
  const afterMatch = line.substring(matchIndex + token.length);

  // In JSX text content (between > and <)
  const lastGt = beforeMatch.lastIndexOf('>');
  const lastLt = beforeMatch.lastIndexOf('<');
  if (lastGt > lastLt) {
    const nextLt = afterMatch.indexOf('<');
    if (nextLt !== -1 || afterMatch.trim() === '') {
      return true;
    }
  }

  // In a string literal
  const quotesBefore = (beforeMatch.match(/["'']/g) || []).length;
  if (quotesBefore % 2 === 1) {
    return true;
  }

  return false;
}

function classifyHit(context: string, token: string): 'IMPLEMENT' | 'REMOVE' | 'FIX_COPY' {
  const lowerContext = context.toLowerCase();

  // If it's in a comment or TODO, likely needs implementation
  if (lowerContext.includes('todo') || /^\s*\/\//.test(context) || /^\s*\/\*/.test(context)) {
    return 'IMPLEMENT';
  }

  // If it's in JSX text content, it's copy that needs fixing
  if (context.includes('>') && context.includes('<')) {
    return 'FIX_COPY';
  }

  // If it's a string literal in UI, fix the copy
  if (context.includes('"') || context.includes("'") || context.includes(''')) {
    return 'FIX_COPY';
  }

  // Default to remove if unclear
  return 'REMOVE';
}

function scanFile(filePath: string): TokenHit[] {
  const hits: TokenHit[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Always-banned tokens
  const alwaysBannedPattern = new RegExp(
    BANNED_TOKENS.map((t) => `\\b${t.replace(/\s+/g, '\\s+')}\\b`).join('|'),
    'gi',
  );

  // Context-sensitive tokens
  const contextSensitivePattern = new RegExp(
    CONTEXT_SENSITIVE_TOKENS.map((t) => `\\b${t}\\b`).join('|'),
    'gi',
  );

  lines.forEach((line, lineIndex) => {
    // Skip import statements
    if (/^\s*import\s/.test(line)) return;

    // Check always-banned tokens
    let match;
    alwaysBannedPattern.lastIndex = 0;

    while ((match = alwaysBannedPattern.exec(line)) !== null) {
      const token = match[0].toLowerCase();

      if (isFalsePositive(line, token)) continue;

      const context = line.trim().substring(0, 120);

      hits.push({
        file: filePath,
        line: lineIndex + 1,
        column: match.index + 1,
        token,
        context,
        classification: classifyHit(context, token),
      });
    }

    // Check context-sensitive tokens (only in user-facing strings)
    contextSensitivePattern.lastIndex = 0;

    while ((match = contextSensitivePattern.exec(line)) !== null) {
      const token = match[0].toLowerCase();

      if (isFalsePositive(line, token)) continue;
      if (!isInUserFacingString(line, match.index, match[0])) continue;

      const context = line.trim().substring(0, 120);

      hits.push({
        file: filePath,
        line: lineIndex + 1,
        column: match.index + 1,
        token,
        context,
        classification: classifyHit(context, token),
      });
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
  const allHits: TokenHit[] = [];

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
    byClassification: {
      IMPLEMENT: allHits.filter((h) => h.classification === 'IMPLEMENT').length,
      REMOVE: allHits.filter((h) => h.classification === 'REMOVE').length,
      FIX_COPY: allHits.filter((h) => h.classification === 'FIX_COPY').length,
    },
    hits: allHits,
  };

  const outputPath = path.join(rootDir, 'reports', 'stub-audit-code.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log(`Scan complete: ${allHits.length} hits found`);
  console.log(`  IMPLEMENT: ${report.byClassification.IMPLEMENT}`);
  console.log(`  REMOVE: ${report.byClassification.REMOVE}`);
  console.log(`  FIX_COPY: ${report.byClassification.FIX_COPY}`);
  console.log(`Report written to: ${outputPath}`);

  // Print first 20 hits for review
  if (allHits.length > 0) {
    console.log('\nFirst 20 hits:');
    allHits.slice(0, 20).forEach((h) => {
      console.log(`  ${h.file}:${h.line} [${h.classification}] "${h.token}"`);
      console.log(`    ${h.context.substring(0, 80)}`);
    });
  }

  // Exit with error if hits found (for CI)
  if (allHits.length > 0) {
    process.exit(1);
  }
}

main();
