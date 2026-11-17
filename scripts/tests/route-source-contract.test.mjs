import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const source = file => readFileSync(file, 'utf8');

test('Student Portal sign-in points to the canonical LMS login page', () => {
  const marketing = source('apps/marketing/app/platform/student-portal/page.tsx');
  assert.ok(marketing.includes('href="https://app.elevateforhumanity.org/login"'));
  assert.ok(!marketing.includes('https://app.elevateforhumanity.org/lms/login'));
  assert.ok(existsSync('apps/lms/app/login/page.tsx'));
});

test('Legacy /lms/login bookmarks redirect safely to the actual sign-in page', () => {
  const config = source('apps/lms/next.config.mjs');
  assert.match(config, /source:\s*'\/lms\/login',\s*destination:\s*'\/login',\s*permanent:\s*false/);
  assert.ok(!existsSync('apps/lms/app/lms/login/page.tsx'));
});

test('Retired AI Tutor URL is backed by a real authenticated destination', () => {
  const marketing = source('apps/marketing/app/platform/student-portal/page.tsx');
  const config = source('apps/lms/next.config.mjs');
  assert.ok(marketing.includes('https://app.elevateforhumanity.org/lms/ai-team'));
  assert.ok(!marketing.includes('https://app.elevateforhumanity.org/lms/ai-tutor'));
  assert.match(config, /source:\s*'\/lms\/ai-tutor',\s*destination:\s*'\/lms\/ai-team',\s*permanent:\s*false/);
  assert.ok(existsSync('apps/lms/app/lms/(app)/ai-team/page.tsx'));
});

test('Route analysis is non-destructive and does not treat missing static references as proof of orphaning', () => {
  const audit = source('scripts/audit-route-reachability.mjs');
  assert.match(audit, /orphan-candidate-NOT-proven/);
  assert.match(audit, /advisoryOnly:true/);
  assert.ok(!audit.includes('rmSync('));
  assert.ok(!audit.includes('unlinkSync('));
  assert.match(audit, /(?:\(app\)|\[\[\.\.\.)/);
});
