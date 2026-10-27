#!/usr/bin/env node
/**
 * Application Flow Audit
 * Fails when application flow consolidation rules are violated.
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'apps/marketing/app');

let failures = 0;

function fail(msg) {
  console.error('❌ FAIL:', msg);
  failures++;
}

function pass(msg) {
  console.log('✅ PASS:', msg);
}

function read(file) {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

function grepRecursive(dir, patterns) {
  const results = [];
  function walk(d) {
    try {
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        if (entry.name === '.next' || entry.name === 'node_modules') continue;
        const full = join(d, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
          const content = readFileSync(full, 'utf8');
          const rel = full.replace(ROOT + '/', '');
          for (const pattern of patterns) {
            if (content.includes(pattern)) {
              results.push({ file: rel, pattern, content });
            }
          }
        }
      }
    } catch {}
  }
  walk(dir);
  return results;
}

// ── 1. Canonical student form ──────────────────────────────────
const canonical = read(join(SRC, 'apply/student/page.tsx'));
const standardFormPage = read(join(SRC, 'apply/student/form/page.tsx'));
const standardForm = read(join(SRC, 'apply/student/StudentApplicationForm.tsx'));
const routing = read(join(ROOT, 'lib/programs/application-config.ts'));
const nextConfig = read(join(ROOT, 'apps/marketing/next.config.mjs'));
if (!canonical?.includes("program === 'hvac-technician' ? '/apply/student/form'")) {
  fail('HVAC must route directly to the standard form without requiring PARIS');
} else {
  pass('HVAC uses the direct standard application route');
}
if (!standardFormPage?.includes('StudentApplicationForm') || !standardFormPage.includes('isHvacApplication')) {
  fail('HVAC standard form must render the canonical application independently of PARIS');
} else {
  pass('HVAC standard form renders without PARIS');
}
if (!standardForm?.includes("fetch('/api/applications'") || !standardForm.includes("'X-Idempotency-Key': idempotencyKey")) {
  fail('HVAC standard form must submit to canonical API with idempotency');
} else {
  pass('HVAC standard form retains canonical submission and idempotency');
}
if (!routing?.includes("'hvac-technician': canonicalProgram(")) {
  fail('HVAC must use canonical application configuration');
} else {
  pass('HVAC canonical application configuration present');
}
if (!nextConfig?.includes("source: '/programs/hvac-technician/apply', destination: '/apply/student?program=hvac-technician'")) {
  fail('Legacy HVAC application must redirect to canonical HVAC application');
} else {
  pass('Legacy HVAC application redirects to canonical HVAC application');
}

// ── 2. Canonical confirmation page ──────────────────────────────
const confirmation = read(join(SRC, 'apply/confirmation/page.tsx'));
if (!confirmation) {
  fail('/apply/confirmation page not found');
} else {
  if (confirmation.includes('Start Onboarding')) {
    fail('/apply/confirmation shows "Start Onboarding" before approval');
  } else {
    pass('/apply/confirmation does not show "Start Onboarding" before approval');
  }
  if (confirmation.includes('program')) {
    pass('/apply/confirmation handles program param');
  }
  if (confirmation.includes('ref')) {
    pass('/apply/confirmation handles ref param');
  }
}

// ── 3. /apply/success must be a redirect ───────────────────────
const success = read(join(SRC, 'apply/success/page.tsx'));
if (!success) {
  fail('/apply/success page not found');
} else {
  if (success.includes('redirect') && success.includes('/apply/confirmation')) {
    pass('/apply/success is a redirect to /apply/confirmation');
  } else {
    fail('/apply/success must redirect to /apply/confirmation');
  }
}

// ── 4. /apply/status must redirect to /apply/track ────────────
const status = read(join(SRC, 'apply/status/page.tsx'));
if (!status) {
  fail('/apply/status page not found');
} else {
  if (status.includes('redirect') && status.includes('/apply/track')) {
    pass('/apply/status redirects to /apply/track');
  } else {
    fail('/apply/status must redirect to /apply/track');
  }
}

// ── 5. Program success pages are redirects ──────────────────────
const programs = [
  'barber-apprenticeship',
  'cosmetology-apprenticeship',
  'hvac-technician',
  'peer-recovery-specialist',
];
for (const prog of programs) {
  const p = join(SRC, `programs/${prog}/apply/success/page.tsx`);
  const c = read(p);
  if (!c) {
    fail(`/programs/${prog}/apply/success not found`);
  } else if (c.includes('redirect') && c.includes('/apply/confirmation')) {
    pass(`/programs/${prog}/apply/success redirects to /apply/confirmation`);
  } else if (c.includes('redirect') && c.includes('/apply/success')) {
    fail(`/programs/${prog}/apply/success redirects to /apply/success (should be /apply/confirmation)`);
  } else {
    // It renders a page instead of redirecting
    if (c.includes('Start Onboarding') || c.includes('login?redirect')) {
      fail(`/programs/${prog}/apply/success shows onboarding/login before approval`);
    }
  }
}

// ── 6. No separate student tracking form ────────────────────────
const track = read(join(SRC, 'apply/track/page.tsx'));
if (track) {
  pass('/apply/track tracker exists (canonical)');
} else {
  fail('/apply/track tracker not found');
}

// ── 7. Reference number in API ──────────────────────────────────
const apiApps = read(join(SRC, 'api/applications/route.ts'));
if (apiApps && (apiApps.includes('referenceNumber') || apiApps.includes('reference_number'))) {
  pass('/api/applications generates reference numbers');
} else {
  fail('/api/applications must generate reference numbers');
}

// ── 8. Summary ──────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
if (failures === 0) {
  console.log('✅ All application flow checks passed!');
  process.exit(0);
} else {
  console.log(`❌ ${failures} check(s) failed`);
  process.exit(1);
}
