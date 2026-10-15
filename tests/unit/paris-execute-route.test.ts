import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  rateLimit: vi.fn(),
  execute: vi.fn(),
  tenant: vi.fn(),
  from: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/lib/admin/guards', () => ({ apiRequireAdmin: mocks.auth }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: mocks.rateLimit }));
vi.mock('@/lib/ai/runtime/command-executor', () => ({ executeAICommand: mocks.execute }));
vi.mock('@/lib/platform/resolve-tenant-for-user', () => ({ resolveTenantIdForUser: mocks.tenant }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: mocks.from }) }));
vi.mock('@/lib/logger', () => ({ logger: { info: mocks.info, warn: mocks.warn, error: mocks.error } }));

import { POST } from '@/apps/admin/app/api/paris/execute/route';

function request(body: unknown) {
  return {
    json: async () => body,
    headers: new Headers(),
    nextUrl: new URL('https://admin.example.test'),
  } as any;
}

function setup() {
  const inserted: any[] = [];
  const updated: any[] = [];
  mocks.auth.mockResolvedValue({ id: 'operator-1', effectiveRoles: ['admin'] });
  mocks.rateLimit.mockResolvedValue(null);
  mocks.tenant.mockResolvedValue('tenant-from-auth');
  mocks.from.mockImplementation(() => ({
    insert: (row: unknown) => {
      inserted.push(row);
      return { select: () => ({ maybeSingle: async () => ({ data: { id: 'task-1' }, error: null }) }) };
    },
    update: (row: unknown) => {
      updated.push(row);
      return { eq: async () => ({ error: null }) };
    },
  }));
  return { inserted, updated };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NODE_ENV = 'test';
});

describe('PARIS execution audit boundary', () => {
  it('binds audit and command context to the authenticated tenant, ignoring request tenant IDs', async () => {
    const { inserted } = setup();
    mocks.execute.mockResolvedValue({
      ok: true, executed: false, status: 'advisory', message: 'Ready', traceId: 'trace-1',
    });

    const response = await POST(request({
      command: 'inspect studio health',
      context: { tenantId: 'tenant-from-request', projectId: 'project-1' },
    }));

    expect(response.status).toBe(200);
    expect(mocks.tenant).toHaveBeenCalledWith('operator-1');
    expect(mocks.execute).toHaveBeenCalledWith('inspect studio health', expect.objectContaining({
      tenantId: 'tenant-from-auth',
      commandContext: { tenantId: 'tenant-from-auth', projectId: 'project-1' },
    }));
    expect(inserted[0]).toMatchObject({
      tenant_id: 'tenant-from-auth',
      payload: { context: { tenantId: 'tenant-from-auth', projectId: 'project-1' } },
    });
    expect(JSON.stringify(inserted[0])).not.toContain('tenant-from-request');
  });

  it('stores and logs a safe classified summary when execution throws a credential-bearing error', async () => {
    const { updated } = setup();
    mocks.execute.mockRejectedValue(new Error('HTTP 401 invalid api key sk-live-private-value'));

    const response = await POST(request({ command: 'inspect studio health' }));
    const body = await response.json();
    const persisted = JSON.stringify(updated);
    const logged = JSON.stringify(mocks.error.mock.calls);

    expect(response.status).toBe(500);
    expect(body.message).toBe('The AI execution service could not complete this request.');
    expect(persisted).toContain('failure');
    expect(persisted).not.toContain('sk-live-private-value');
    expect(logged).not.toContain('sk-live-private-value');
    expect(logged).toContain('credentials');
  });
});
