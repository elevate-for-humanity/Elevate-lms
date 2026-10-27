import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ db: { from: vi.fn() }, hydrate: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => mocks.db }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: mocks.hydrate }));
vi.mock('@/lib/billing/config', () => ({ loadBillingProviderConfig: vi.fn() }));
vi.mock('@/lib/billing/providers/quickbooks', () => ({ ensureQuickBooksCustomer: vi.fn() }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_path: string, handler: unknown) => handler }));

import { POST } from '@/apps/admin/app/api/internal/ai-operator/route';

const job = { id: 'job-1', user_id: 'user-1', tool_args: { incident_id: 'incident-1', workflow: 'credential_upload' } };
type Operation = { table: string; kind: string; values?: any };
let writes: Operation[];

function database(fail?: (op: Operation) => boolean, missingIncident = false) {
  mocks.db.from.mockImplementation((table: string) => {
    const op: Operation = { table, kind: 'select' };
    const builder: any = {
      select() { return builder; },
      eq() { return builder; },
      order() { return builder; },
      limit() { return builder; },
      update(values: unknown) { op.kind = 'update'; op.values = values; writes.push(op); return builder; },
      insert(values: unknown) { op.kind = 'insert'; op.values = values; writes.push(op); return builder; },
      maybeSingle() { return Promise.resolve(result()); },
      then(resolve: any, reject: any) { return Promise.resolve(result()).then(resolve, reject); },
    };
    function result() {
      if (fail?.(op)) return { data: null, error: { message: 'database write failed' } };
      if (op.kind === 'select' && table === 'devstudio_jobs') return { data: [job], error: null };
      if (op.kind === 'select' && table === 'platform_incidents') return { data: missingIncident ? null : { tenant_id: 'tenant-1' }, error: null };
      return { data: null, error: null };
    }
    return builder;
  });
}

function request(authorization = 'Bearer test-scheduler-credential') {
  return new NextRequest('https://admin.example.test/api/internal/ai-operator', {
    method: 'POST', headers: { authorization },
  });
}

describe('PARIS diagnostic persistence', () => {
  beforeEach(() => {
    writes = [];
    vi.stubEnv('CRON_SECRET', 'test-scheduler-credential');
    mocks.db.from.mockReset();
    mocks.hydrate.mockResolvedValue(undefined);
  });
  afterEach(() => vi.unstubAllEnvs());

  it('preserves administrator approval while recording a successful diagnostic handoff', async () => {
    database();
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect((await response.json()).results).toEqual([{ id: job.id, status: 'review_required' }]);
    expect(writes.find(op => op.table === 'platform_control_actions')?.values).toMatchObject({
      action_type: 'workflow_repair', tenant_id: 'tenant-1', requires_approval: true,
      approval_status: 'pending', parameters: { incident_id: 'incident-1', devstudio_job_id: job.id },
    });
  });

  it.each(['platform_incidents', 'platform_control_actions'])('does not complete a diagnostic when writing %s fails', async (table) => {
    database(op => op.table === table && op.kind !== 'select');
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect((await response.json()).results).toEqual([{ id: job.id, status: 'failed' }]);
    expect(writes.some(op => op.table === 'devstudio_jobs' && op.values.status === 'completed')).toBe(false);
  });

  it('does not report completion when the diagnostic completion write fails', async () => {
    database(op => op.table === 'devstudio_jobs' && op.kind === 'update' && op.values.status === 'completed');
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect((await response.json()).results[0].status).toBe('failed');
  });

  it('rejects an orphan diagnostic before creating a repair action', async () => {
    database(undefined, true);
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(writes.some(op => op.table === 'platform_control_actions')).toBe(false);
  });

  it('requires the configured scheduler bearer even when called without middleware', async () => {
    database();
    const response = await POST(request('Bearer wrong'));
    expect(response.status).toBe(401);
    expect(mocks.db.from).not.toHaveBeenCalled();
  });
});
