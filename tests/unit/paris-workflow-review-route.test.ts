import {beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), rate: vi.fn(), tenant: vi.fn(), approve: vi.fn(), from: vi.fn(), canonicalPost: vi.fn(),
  WorkflowRepairError: class extends Error {constructor(message: string, public status: number) {super(message);}},
}));
vi.mock('@/lib/devstudio/api-auth', () => ({apiRequireDevStudio: mocks.auth}));
vi.mock('@/lib/api/withRateLimit', () => ({applyRateLimit: mocks.rate}));
vi.mock('@/lib/platform/resolve-tenant-for-user', () => ({resolveTenantIdForUser: mocks.tenant}));
vi.mock('@/lib/supabase/admin', () => ({requireAdminClient: async () => ({from: mocks.from})}));
vi.mock('@/lib/control-plane/workflow-repairs', () => ({
  approveWorkflowRepair: mocks.approve, WorkflowRepairError: mocks.WorkflowRepairError,
}));
vi.mock('@/lib/devstudio/os/command-center', () => ({buildCommandCenterSnapshot: vi.fn()}));
vi.mock('@/lib/devstudio/os/repo-indexer', () => ({indexRepository: vi.fn(), searchRepoIndex: vi.fn()}));
vi.mock('@/lib/logger', () => ({logger: {error: vi.fn()}}));
vi.mock('@/apps/admin/app/api/paris/execute/route', () => ({POST: mocks.canonicalPost}));

import {GET, POST} from '@/apps/admin/app/api/admin/dev-studio/workflows/route';
import {POST as legacyPost} from '@/apps/admin/app/api/paris/commands/route';

const actionId = '22222222-2222-4222-8222-222222222222';
const request = (body: any = {}, search = '') => ({
  json: async () => body, nextUrl: new URL(`https://admin.example.test/api/admin/dev-studio/workflows${search}`),
}) as any;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({id: 'administrator-1', effectiveRoles: ['admin']});
  mocks.rate.mockResolvedValue(null);
  mocks.tenant.mockResolvedValue('tenant-1');
  mocks.approve.mockResolvedValue({repairId: 'repair-1', incidentId: 'incident-1', status: 'queued', verified: false});
  mocks.from.mockImplementation((table: string) => {
    let rows: any[] = table === 'platform_incidents' ? [
      {id: 'incident-1', tenant_id: 'tenant-1', title: 'Document upload failed', description: 'Upload rejected', status: 'identified'},
      {id: 'foreign-incident', tenant_id: 'tenant-2', title: 'Private foreign incident', status: 'identified'},
    ] : [
      {id: actionId, tenant_id: 'tenant-1', action_type: 'workflow_repair', approval_status: 'pending', parameters: {incident_id: 'incident-1'}},
      {id: 'another-action', tenant_id: 'tenant-2', action_type: 'workflow_repair', approval_status: 'pending', parameters: {incident_id: 'foreign-incident'}},
    ];
    const query: any = {
      select: () => query, order: () => query, limit: () => query,
      eq: (key: string, value: unknown) => {rows = rows.filter((row: any) => row[key] === value); return query;},
      in: (key: string, values: unknown[]) => {rows = rows.filter((row: any) => values.includes(row[key])); return query;},
      then: (resolve: any, reject: any) => Promise.resolve({data: rows, error: null}).then(resolve, reject),
    };
    return query;
  });
});

describe('authenticated workflow repair review API', () => {
  it('lists only the authenticated administrator tenant repair actions', async () => {
    const response = await GET(request({}, '?view=workflow-repairs'));
    expect(response.status).toBe(200);
    expect((await response.json()).workflowRepairs).toEqual([
      expect.objectContaining({id: actionId, tenant_id: 'tenant-1',
        incident: expect.objectContaining({id: 'incident-1', title: 'Document upload failed'})}),
    ]);
  });

  it('returns accepted durable work and derives the approver and tenant from authentication', async () => {
    const response = await POST(request({action: 'approve-workflow-repair', actionId,
      actorId: 'forged-user', tenantId: 'forged-tenant', actorRoles: ['super_admin']}));
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({approved: true, repairId: 'repair-1', status: 'queued', verified: false});
    expect(mocks.approve).toHaveBeenCalledWith(expect.anything(), actionId, {
      actorId: 'administrator-1', actorRoles: ['admin'], tenantId: 'tenant-1',
    });
  });

  it('never approves work when the route guard rejects the caller', async () => {
    mocks.auth.mockResolvedValue({error: Response.json({error: 'Forbidden'}, {status: 403})});
    const response = await POST(request({action: 'approve-workflow-repair', actionId}));
    expect(response.status).toBe(403);
    expect(mocks.approve).not.toHaveBeenCalled();
  });

  it('rejects malformed action IDs before queueing work', async () => {
    const response = await POST(request({action: 'approve-workflow-repair', actionId: 'not-an-id'}));
    expect(response.status).toBe(400);
    expect(mocks.approve).not.toHaveBeenCalled();
  });

  it('preserves the helper authorization verdict', async () => {
    mocks.approve.mockRejectedValue(new mocks.WorkflowRepairError('Workflow repair action not found.', 404));
    const response = await POST(request({action: 'approve-workflow-repair', actionId}));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({error: 'Workflow repair action not found.'});
  });

  it('routes the legacy commands endpoint through the same guarded executor', () => {
    expect(legacyPost).toBe(mocks.canonicalPost);
  });
});
