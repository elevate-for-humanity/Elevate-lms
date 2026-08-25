#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter((file) => /\.(?:[cm]?[jt]sx?|json|ya?ml)$/.test(file))
  .filter((file) => !/(?:^|\/)(?:tests?|fixtures?|__mocks__)(?:\/|$)/.test(file));

const secretPatterns = [
  ['SendGrid API key', /SG\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}/g],
  ['OpenAI API key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/g],
  ['GitHub access token', /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}/g],
  ['AWS access key', /\bAKIA[A-Z0-9]{16}\b/g],
  ['Supabase service-role JWT', /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g],
];

const violations = [];
for (const file of trackedFiles) {
  // A tracked file can be intentionally removed in the release diff. Deleted
  // files cannot ship credentials and must not make the audit itself crash.
  if (!existsSync(file)) continue;
  const source = readFileSync(file, 'utf8');
  for (const [label, pattern] of secretPatterns) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      if (!/placeholder|example/i.test(match[0])) violations.push(`${file}: ${label}`);
    }
  }

  const passwordLiteral = /\bpassword\s*:\s*(['"])([^'"\n]{8,})\1/g;
  while (passwordLiteral.exec(source) !== null) {
    violations.push(`${file}: plaintext password literal`);
  }
}

if (violations.length > 0) {
  console.error('Hardcoded credential audit failed:');
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}

console.log(`Hardcoded credential audit passed (${trackedFiles.length} tracked source files).`);
