#!/usr/bin/env node
/**
 * Fix WEAK_CTA_COPY violations.
 * Only replaces bare text node occurrences inside JSX button/link children.
 * Conservative: only replaces exact matches surrounded by JSX delimiters.
 *
 * Replacements:
 *   "Learn More"  → "See Details"
 *   "Click Here"  → "Get Started"
 *   "Explore"     → "View Options"
 *   "Submit"      → "Save" (only in button context — not form submit inputs)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'artifacts', 'design-enforcer-report.json'), 'utf8'));
const findings = report.findings ?? [];

const affectedFiles = [...new Set(
  findings.filter(f => f.code === 'WEAK_CTA_COPY').map(f => f.file)
)];

// Only replace when the word appears as JSX text content (between > and <)
// or as a string literal in a button/link label prop
const REPLACEMENTS = [
  // JSX text nodes: >Learn More< or >Learn More</
  [/>Learn More</g,  '>See Details<'],
  [/>Click Here</g,  '>Get Started<'],
  // "Explore" as standalone text node — be careful not to hit "Explore Programs" etc.
  [/>Explore</g,     '>View Options<'],
  // String props: label="Learn More" or children="Learn More"
  [/("Learn More")/g,  '"See Details"'],
  [/('Learn More')/g,  "'See Details'"],
  [/("Click Here")/g,  '"Get Started"'],
  [/('Click Here')/g,  "'Get Started'"],
  // Submit as JSX text in buttons (not type="submit" inputs)
  [/>Submit</g,      '>Save<'],
];

let fixedFiles = 0;
let fixedCount = 0;

for (const relPath of affectedFiles) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) continue;

  let content = fs.readFileSync(absPath, 'utf8');
  const original = content;

  for (const [pattern, replacement] of REPLACEMENTS) {
    content = content.replace(pattern, replacement);
  }

  if (content !== original) {
    fs.writeFileSync(absPath, content, 'utf8');
    fixedFiles++;
    fixedCount += findings.filter(f => f.code === 'WEAK_CTA_COPY' && f.file === relPath).length;
  }
}

console.log(`Fixed weak CTA copy in ${fixedCount} locations across ${fixedFiles} files`);
