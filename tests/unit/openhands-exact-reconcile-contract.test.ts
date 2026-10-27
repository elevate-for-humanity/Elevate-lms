import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (file: string) => readFileSync(path.join(process.cwd(), file), 'utf8');

// Release guard: production repair must never broaden an exact-task retry.
describe('exact OpenHands reconciliation contract', () => {
  it('scopes the provider queue query to one requested task', () => {
    const runtime = source('lib/devstudio/openhands/runtime.ts');
    expect(runtime).toContain("if (taskId) query = query.eq('id', taskId)");
    expect(runtime).toContain('limit(taskId ? 1 :');
  });

  it('requires scheduler authentication and a UUID task id', () => {
    const route = source('apps/admin/app/api/cron/openhands-reconcile/route.ts');
    expect(route).toContain("request.headers.get('authorization') !== `Bearer ${cronSecret}`");
    expect(route).toContain('if (!UUID_RE.test(taskId))');
    expect(route).toContain('reconcileOpenHandsTasks(1, taskId)');
  });
});
