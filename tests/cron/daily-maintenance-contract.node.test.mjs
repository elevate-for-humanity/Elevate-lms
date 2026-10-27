import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/cron-scheduler.yml', 'utf8');
const guardrailRoute = readFileSync('apps/admin/app/api/cron/guardrail-evaluation/route.ts', 'utf8');
const cleanupRoute = readFileSync('apps/admin/app/api/cron/memory-cleanup/route.ts', 'utf8');
const noShowRoute = readFileSync('apps/admin/app/api/cron/testing-no-show/route.ts', 'utf8');
const daily = workflow.split('daily-maintenance:\n')[1]?.split('  # ── Weekly Monday')[0];
assert.ok(daily, 'Daily maintenance job must exist');

test('guardrail cron uses the exported GET route and bearer authorization', () => {
  assert.match(guardrailRoute, /export async function GET\(/);
  assert.match(daily, /-X GET "\$ADMIN_URL\/api\/cron\/guardrail-evaluation"/);
  assert.match(daily, /"Authorization: Bearer \$CRON_SECRET"/);
});

test('testing no-show uses the required x-cron-secret header', () => {
  assert.match(noShowRoute, /export async function GET\(/);
  assert.match(noShowRoute, /headers\.get\('x-cron-secret'\)/);
  assert.match(daily, /-X GET "\$ADMIN_URL\/api\/cron\/testing-no-show"/);
  assert.match(daily, /"x-cron-secret: \$CRON_SECRET"/);
});

test('memory cleanup remains POST with bearer authorization', () => {
  assert.match(cleanupRoute, /export const POST =/);
  assert.match(daily, /-X POST "\$ADMIN_URL\/api\/cron\/memory-cleanup"/);
});

test('maintenance jobs check HTTP results and the final gate reports failure', () => {
  for (const id of ['guardrails', 'memory_cleanup', 'testing_no_show']) {
    assert.match(daily, new RegExp('id: '+id+'\\n\\s+continue-on-error: true'));
    assert.match(daily, new RegExp('steps\\.'+id+'\\.outcome'));
  }
  assert.match(daily, /Require daily maintenance routes to succeed/);
  assert.match(daily, /if: always\(\)/);
  assert.match(daily, /--output \/dev\/null --write-out '%\{http_code\}'/);
  assert.doesNotMatch(daily, /::warning::(?:guardrail-evaluation|testing-no-show) failed/);
});

test('guardrail authorization fails closed without a configured secret', () => {
  assert.match(guardrailRoute, /if \(!cronSecret \|\| authHeader !==/);
});
