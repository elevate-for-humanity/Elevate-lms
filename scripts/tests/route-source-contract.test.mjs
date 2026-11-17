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
  assert.ok(audit.includes('function matchesServiceRoute'));
});

test('Route inventory classifies real routes, legacy redirect targets, and missing inbound links conservatively', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, dirname } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const temp = mkdtempSync(join(tmpdir(), 'efh-route-map-'));
  const put = (file, body) => {
    const target = join(temp, file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, body);
  };
  try {
    put('apps/lms/app/login/page.tsx', 'export default function Login() {}');
    put('apps/lms/app/lms/(app)/ai-team/page.tsx', 'export default function Team() {}');
    put('apps/lms/app/lms/(app)/grades/page.tsx', 'export default function Grades() {}');
    put('apps/lms/app/legacy/page.tsx', "import { redirect } from 'next/navigation'; export default function Legacy(){redirect('/lms/grades')}");
    put('apps/lms/next.config.mjs', "export default {redirects(){return [{ source: '/lms/login', destination: '/login', permanent: false }]}}");
    put('apps/marketing/app/platform/student-portal/page.tsx', "const login = { href: 'https://app.elevateforhumanity.org/login' }; const broken = { href: 'https://app.elevateforhumanity.org/lms/unknown' };");
    put('scripts/audit-route-reachability.mjs', source('scripts/audit-route-reachability.mjs'));
    const run = spawnSync(process.execPath, ['scripts/audit-route-reachability.mjs'], {
      cwd: temp, encoding: 'utf8', timeout: 30000
    });
    assert.equal(run.status, 0, run.stderr || run.stdout);
    const report = JSON.parse(readFileSync(join(temp, 'artifacts/route-reachability-advisory.json'), 'utf8'));
    assert.equal(report.advisoryOnly, true);
    assert.equal(report.inventory.find(route => route.url === '/legacy').classification, 'connected-compatibility-redirect');
    assert.equal(report.inventory.find(route => route.url === '/lms/grades').classification, 'connected-static-source-reference');
    assert.ok(report.redirectOnlyAliases.some(route => route.source === '/lms/login' && route.targetExists === true));
    assert.ok(report.crossHostLinks.some(link => link.url.endsWith('/lms/unknown') && link.classification === 'target-needs-runtime-verification'));
    assert.ok(report.crossHostLinks.some(link => link.url.endsWith('/login') && link.classification === 'target-source-defined'));
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
