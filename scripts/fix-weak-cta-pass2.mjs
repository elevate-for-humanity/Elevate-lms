#!/usr/bin/env node
/**
 * Pass 2: fix remaining WEAK_CTA_COPY violations.
 * Only replaces when the word is clearly a button/link label:
 *   - JSX text between button tags: <button ...>Submit</button>
 *   - Button children prop: children="Submit"
 *   - Standalone JSX text node: >Submit< (not inside prose)
 *
 * Does NOT replace "Submit" in body text, list items, or prose.
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

let fixedFiles = 0;
let fixedCount = 0;

for (const relPath of affectedFiles) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) continue;

  let content = fs.readFileSync(absPath, 'utf8');
  const original = content;

  // Pattern 1: JSX text node that is ONLY the word (surrounded by tag delimiters)
  // >Submit< or > Submit < — replace with >Save<
  content = content.replace(/>\s*Submit\s*</g, '>Save<');
  content = content.replace(/>\s*Explore\s*</g, '>View Options<');
  content = content.replace(/>\s*Learn More\s*</g, '>See Details<');
  content = content.replace(/>\s*Click Here\s*</g, '>Get Started<');

  // Pattern 2: string prop values — children="Submit" or label="Submit"
  content = content.replace(/\b(children|label|text|buttonText|cta)=["']Submit["']/g, '$1="Save"');
  content = content.replace(/\b(children|label|text|buttonText|cta)=["']Explore["']/g, '$1="View Options"');
  content = content.replace(/\b(children|label|text|buttonText|cta)=["']Learn More["']/g, '$1="See Details"');
  content = content.replace(/\b(children|label|text|buttonText|cta)=["']Click Here["']/g, '$1="Get Started"');

  // Pattern 3: template literal button labels: `Submit` alone
  content = content.replace(/`Submit`/g, '`Save`');
  content = content.replace(/`Explore`/g, '`View Options`');
  content = content.replace(/`Learn More`/g, '`See Details`');

  if (content !== original) {
    fs.writeFileSync(absPath, content, 'utf8');
    fixedFiles++;
    fixedCount += findings.filter(f => f.code === 'WEAK_CTA_COPY' && f.file === relPath).length;
  }
}

console.log(`Pass 2 CTA: fixed ~${fixedCount} findings across ${fixedFiles} files`);
