#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const RULES = [
  ['Stripe live secret', /sk_live_[A-Za-z0-9]{20,}/g],
  ['Stripe restricted secret', /rk_live_[A-Za-z0-9]{20,}/g],
  ['OpenAI secret', /sk-(?:proj-)?[A-Za-z0-9_-]{40,}/g],
  ['Anthropic secret', /sk-ant-[A-Za-z0-9_-]{20,}/g],
  ['SendGrid secret', /SG\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g],
  ['GitHub token', /gh[pousr]_[A-Za-z0-9]{20,}/g],
  ['AWS access key', /AKIA[0-9A-Z]{16}/g],
  ['Private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['JWT credential', /eyJhbGciOiJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g],
];

const EXCLUDED_PREFIXES = [
  '.git/',
  'node_modules/',
  '.next/',
  'coverage/',
  'scripts/security/credential-scan.mjs',
  '.githooks/pre-commit',
];

function trackedFiles() {
  return execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean)
    .filter((file) => !EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix)));
}

const findings = [];

for (const file of trackedFiles()) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  if (content.includes('\0')) continue;

  for (const [label, expression] of RULES) {
    expression.lastIndex = 0;
    for (const match of content.matchAll(expression)) {
      const nearby = content.slice(match.index, match.index + 120);
      if (label === 'Private key' && nearby.includes('PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY')) {
        continue;
      }
      const line = content.slice(0, match.index).split('\n').length;
      findings.push({ file, line, label });
    }
  }
}

if (findings.length > 0) {
  console.error(`Credential scan failed: ${findings.length} potential credential(s) found.`);
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} [${finding.label}]`);
  }
  console.error('Credential values were suppressed. Revoke real credentials before removing them from the repository.');
  process.exit(1);
}

console.log('Credential scan passed: no tracked plaintext credentials detected.');
