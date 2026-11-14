import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ db: vi.fn(), user: vi.fn(), rate: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.db }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: mocks.user } }) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: mocks.rate }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_path: string, handler: unknown) => handler }));
import { POST } from '@/apps/lms/app/api/paris/workflow-incident/route';

type Operation = { table: string; kind: string; values?: any };
const incident = () => ({ id: 'incident-1', tenant_id: 'tenant-1', created_by: 'learner-1',
  incident_type: 'workflow', affected_services: ['document_upload'], status: 'investigating', created_at: new Date().toISOString() });

function database(existingIncident = false) {
  const tables: Record<string, any[]> = {
    profiles: [{ id: 'learner-1', tenant_id: 'tenant-1', role: 'student' }],
    platform_incidents: existingIncident ? [incident()] : [], devstudio_jobs: [],
  };
  const writes: Operation[] = [];
  let fail: ((op: Operation) => boolean) | undefined;
  let sequence = 0;
  const db: any = { tables, writes,
    failWhen(predicate?: (op: Operation) => boolean) { fail = predicate; },
    from(table: string) {
      const filters: Array<(row: any) => boolean> = [];
      const op: Operation = { table, kind: 'select' };
      let limit = Infinity;
      let one = false;
      const value = (row: any, key: string) => key.includes('->>') ? row[key.split('->>')[0]]?.[key.split('->>')[1]] : row[key];
      const result = () => {
        if (fail?.(op)) return { data: null, error: { message: 'Simulated private database error' } };
        let rows = tables[table].filter(row => filters.every(filter => filter(row))).slice(0, limit);
        if (op.kind === 'insert') {
          if (op.values.id && tables[table].some(row => row.id === op.values.id)) return { data: null, error: { code: '23505' } };
          const row = { id: `inserted-${++sequence}`, created_at: new Date().toISOString(), ...structuredClone(op.values) };
          tables[table].push(row); rows = [row]; writes.push(op);
        }
        return { data: structuredClone(one ? rows[0] ?? null : rows), error: null };
      };
      const query: any = {
        select() { return query; }, order() { return query; },
        eq(key: string, expected: unknown) { filters.push(row => value(row, key) === expected); return query; },
        is(key: string, expected: unknown) { return query.eq(key, expected); },
        in(key: string, expected: unknown[]) { filters.push(row => expected.includes(value(row, key))); return query; },
        contains(key: string, expected: unknown[]) { filters.push(row => expected.every(item => row[key]?.includes(item))); return query; },
        gte(key: string, expected: string) { filters.push(row => row[key] >= expected); return query; },
        limit(value: number) { limit = value; return query; },
        insert(values: any) { op.kind = 'insert'; op.values = values; return query; },
        maybeSingle() { one = true; return query; }, single() { one = true; return query; },
        then(resolve: any, reject: any) { return Promise.resolve().then(result).then(resolve, reject); },
      };
      return query;
    },
  };
  mocks.db.mockResolvedValue(db);
  return db;
}

function request() {
  return new NextRequest('https://app.example.test/api/paris/workflow-incident', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflow: 'document_upload', message: 'Upload failed', page: '/learner/documents', status: 500,
      user_id: 'forged-user', tenant_id: 'forged-tenant' }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ data: { user: { id: 'learner-1' } }, error: null });
  mocks.rate.mockResolvedValue(null);
});

describe('durable portal workflow diagnostic receipt', () => {
  it('confirms both persisted records and binds them to the authenticated user and tenant', async () => {
    const db = database();
    const response = await POST(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, incidentId: db.tables.platform_incidents[0].id, diagnosticJobId: db.tables.devstudio_jobs[0].id, diagnosticStatus: 'running' });
    expect(db.tables.platform_incidents[0]).toMatchObject({ created_by: 'learner-1', tenant_id: 'tenant-1' });
    expect(db.tables.devstudio_jobs[0]).toMatchObject({ user_id: 'learner-1', tool_args: { incident_id: body.incidentId, workflow: 'document_upload' } });
  });

  it.each(['profiles', 'platform_incidents', 'devstudio_jobs'])('fails visibly when reading %s fails', async table => {
    const db = database();
    db.failWhen((op: Operation) => op.table === table && op.kind === 'select');
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect((await response.json()).ok).not.toBe(true);
    expect(db.tables.devstudio_jobs).toHaveLength(0);
  });

  it('does not acknowledge a diagnostic insert failure, and retry fills the missing handoff', async () => {
    const db = database();
    db.failWhen((op: Operation) => op.table === 'devstudio_jobs' && op.kind === 'insert');
    expect((await POST(request())).status).toBe(503);
    expect(db.tables.platform_incidents).toHaveLength(1);
    db.failWhen();
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ duplicate: true, diagnosticStatus: 'running' });
    expect(db.tables.platform_incidents).toHaveLength(1);
    expect(db.tables.devstudio_jobs).toHaveLength(1);
  });

  it('repairs a legacy duplicate incident that has no diagnostic job', async () => {
    const db = database(true);
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ duplicate: true, diagnosticJobId: expect.any(String) });
    expect(db.tables.devstudio_jobs).toHaveLength(1);
  });

  it('deduplicates concurrent retries using the job primary key without resetting job state', async () => {
    const db = database(true);
    const responses = await Promise.all([POST(request()), POST(request())]);
    expect(responses.map(response => response.status)).toEqual([200, 200]);
    const bodies = await Promise.all(responses.map(response => response.json()));
    expect(bodies[0].diagnosticJobId).toBe(bodies[1].diagnosticJobId);
    expect(db.tables.devstudio_jobs).toHaveLength(1);
  });

  it('reuses an existing completed diagnostic without reopening it', async () => {
    const db = database(true);
    db.tables.devstudio_jobs.push({ id: 'completed-job', user_id: 'learner-1', tool_name: 'workflow_diagnostic', status: 'completed',
      tool_args: { incident_id: 'incident-1', workflow: 'document_upload' } });
    const response = await POST(request());
    expect(await response.json()).toMatchObject({ ok: true, diagnosticJobId: 'completed-job', diagnosticStatus: 'completed' });
    expect(db.writes).toHaveLength(0);
  });

  it.each(['failed', 'cancelled'])('keeps a %s diagnostic visible for review instead of silently restarting it', async status => {
    const db = database(true);
    db.tables.devstudio_jobs.push({ id: 'failed-job', user_id: 'learner-1', tool_name: 'workflow_diagnostic', status,
      tool_args: { incident_id: 'incident-1', workflow: 'document_upload' } });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect((await response.json()).diagnosticStatus).toBe(status);
    expect(db.writes).toHaveLength(0);
  });

  it('does not reuse an incident from a previous tenant', async () => {
    const db = database(true);
    db.tables.platform_incidents[0].tenant_id = 'old-tenant';
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect((await response.json()).incidentId).not.toBe('incident-1');
    expect(db.tables.devstudio_jobs[0].tool_args.incident_id).toBe(db.tables.platform_incidents[1].id);
  });

  it('rejects inconsistent saved diagnostic correlation', async () => {
    const db = database(true);
    db.tables.devstudio_jobs.push({ id: 'wrong-workflow-job', user_id: 'learner-1', tool_name: 'workflow_diagnostic', status: 'completed',
      tool_args: { incident_id: 'incident-1', workflow: 'attendance' } });
    expect((await POST(request())).status).toBe(409);
    expect(db.writes).toHaveLength(0);
  });

  it('fails closed without an authenticated profile or session', async () => {
    const db = database();
    db.tables.profiles = [];
    expect((await POST(request())).status).toBe(403);
    expect(db.writes).toHaveLength(0);
    mocks.user.mockResolvedValue({ data: { user: null } });
    expect((await POST(request())).status).toBe(401);
  });
});
