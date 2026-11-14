import {beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({enqueue: vi.fn()}));
vi.mock('@/lib/ai/runtime/code-repair', () => ({enqueueParisRepair: mocks.enqueue}));

import {approveWorkflowRepair, reconcileWorkflowRepairActions} from '@/lib/control-plane/workflow-repairs';

function database() {
  const tables: Record<string, any[]> = {
    platform_control_actions: [{id: 'action-1', tenant_id: 'tenant-1', action_type: 'workflow_repair',
      status: 'pending', approval_status: 'pending',
      parameters: {incident_id: 'incident-1', devstudio_job_id: 'diagnostic-1'}, result: null}],
    platform_incidents: [{id: 'incident-1', tenant_id: 'tenant-1', incident_type: 'workflow',
      status: 'identified', affected_services: ['document_upload'], created_by: 'learner-1',
      description: 'Document upload failed with HTTP 500.'}],
    devstudio_jobs: [{id: 'diagnostic-1', user_id: 'learner-1', tool_name: 'workflow_diagnostic',
      tool_args: {incident_id: 'incident-1', workflow: 'document_upload'}}],
    paris_code_repairs: [],
  };
  const writes: Array<{table: string; patch: any}> = [];
  const db = {from(table: string) {
    const filters: Array<(row: any) => boolean> = [];
    let patch: any;
    const value = (row: any, key: string) => key.includes('->>')
      ? row[key.split('->>')[0]]?.[key.split('->>')[1]] : row[key];
    const run = () => {
      const selected = (tables[table] ?? []).filter(row => filters.every(filter => filter(row)));
      if (patch) {
        writes.push({table, patch});
        selected.forEach(row => Object.assign(row, structuredClone(patch)));
      }
      return {data: structuredClone(selected), error: null};
    };
    const query: any = {
      select: () => query,
      update: (data: any) => {patch = data; return query;},
      eq: (key: string, expected: any) => {filters.push(row => value(row, key) === expected); return query;},
      is: (key: string, expected: any) => {filters.push(row => value(row, key) === expected); return query;},
      in: (key: string, expected: any[]) => {filters.push(row => expected.includes(value(row, key))); return query;},
      maybeSingle: async () => {const result = run(); return {...result, data: result.data[0] ?? null};},
      then: (resolve: any, reject: any) => Promise.resolve(run()).then(resolve, reject),
    };
    return query;
  }};
  mocks.enqueue.mockImplementation(async (input: any) => {
    if (!tables.paris_code_repairs.some(row => row.fingerprint === input.fingerprint)) {
      tables.paris_code_repairs.push({id: 'repair-1', status: 'queued', ...input});
    }
    return {id: 'repair-1'};
  });
  return {db, tables, writes};
}

const context = {actorId: 'administrator-1', actorRoles: ['admin'], tenantId: 'tenant-1'};
beforeEach(() => vi.clearAllMocks());

describe('approved portal workflow repair', () => {
  it('queues a durable repair with the approving administrator and preserves unresolved workflow state', async () => {
    const {db, tables} = database();
    const result = await approveWorkflowRepair(db, 'action-1', context);
    expect(result).toMatchObject({repairId: 'repair-1', incidentId: 'incident-1', status: 'queued', verified: false});
    expect(mocks.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      actorId: 'administrator-1', fingerprint: 'portal-workflow:incident-1',
    }));
    expect(tables.platform_control_actions[0]).toMatchObject({status: 'running', approved_by: 'administrator-1'});
    expect(tables.platform_incidents[0].status).toBe('identified');
    expect(tables.platform_control_actions[0].completed_at).toBeNull();
  });

  it('reuses the same durable repair when an approved action is retried', async () => {
    const {db, tables} = database();
    const first = await approveWorkflowRepair(db, 'action-1', context);
    const second = await approveWorkflowRepair(db, 'action-1', context);
    expect(second.repairId).toBe(first.repairId);
    expect(mocks.enqueue).toHaveBeenCalledTimes(1);
    expect(tables.paris_code_repairs).toHaveLength(1);
  });

  it('rejects learner approval without creating any repair', async () => {
    const {db, writes} = database();
    await expect(approveWorkflowRepair(db, 'action-1', {...context, actorRoles: ['student']}))
      .rejects.toMatchObject({status: 403});
    expect(mocks.enqueue).not.toHaveBeenCalled();
    expect(writes).toHaveLength(0);
  });

  it('does not expose or approve another tenant action to an administrator', async () => {
    const {db, writes} = database();
    await expect(approveWorkflowRepair(db, 'action-1', {...context, tenantId: 'other-tenant'}))
      .rejects.toMatchObject({status: 404});
    expect(mocks.enqueue).not.toHaveBeenCalled();
    expect(writes).toHaveLength(0);
  });

  it.each(['incident', 'diagnostic', 'learner', 'workflow'])('rejects mismatched %s evidence', async kind => {
    const {db, tables, writes} = database();
    if (kind === 'incident') tables.platform_incidents[0].tenant_id = 'other-tenant';
    if (kind === 'diagnostic') tables.devstudio_jobs[0].tool_args.incident_id = 'another-incident';
    if (kind === 'learner') tables.devstudio_jobs[0].user_id = 'another-learner';
    if (kind === 'workflow') tables.devstudio_jobs[0].tool_args.workflow = 'billing_setup';
    await expect(approveWorkflowRepair(db, 'action-1', context)).rejects.toMatchObject({status: 409});
    expect(mocks.enqueue).not.toHaveBeenCalled();
    expect(writes).toHaveLength(0);
  });

  it('preserves a rejected decision', async () => {
    const {db, tables, writes} = database();
    tables.platform_control_actions[0].approval_status = 'rejected';
    await expect(approveWorkflowRepair(db, 'action-1', context)).rejects.toMatchObject({status: 409});
    expect(writes).toHaveLength(0);
  });

  it('does not report success when the durable queue write fails', async () => {
    const {db, tables} = database();
    mocks.enqueue.mockRejectedValueOnce(new Error('database temporarily unavailable'));
    await expect(approveWorkflowRepair(db, 'action-1', context)).rejects.toThrow('database temporarily unavailable');
    expect(tables.platform_control_actions[0]).toMatchObject({status: 'failed', error_message: 'WORKFLOW_REPAIR_QUEUE_FAILED'});
    expect(tables.platform_incidents[0].status).toBe('identified');
  });

  it('completes only the code repair receipt and leaves the incident awaiting a workflow retry', async () => {
    const {db, tables} = database();
    await approveWorkflowRepair(db, 'action-1', context);
    await reconcileWorkflowRepairActions(db, {id: 'repair-1', status: 'verified', release_sha: 'release-sha'});
    expect(tables.platform_control_actions[0]).toMatchObject({status: 'completed', result: {verified: true, releaseSha: 'release-sha'}});
    expect(tables.platform_incidents[0].status).toBe('monitoring');
    expect(tables.platform_incidents[0].remediation).toContain('still needs a user retry');
  });

  it('keeps a blocked repair visible and does not resolve the incident', async () => {
    const {db, tables} = database();
    await approveWorkflowRepair(db, 'action-1', context);
    await reconcileWorkflowRepairActions(db, {id: 'repair-1', status: 'blocked', error_code: 'VALIDATION_FAILED'});
    expect(tables.platform_control_actions[0]).toMatchObject({status: 'failed', error_message: 'VALIDATION_FAILED'});
    expect(tables.platform_incidents[0].status).toBe('identified');
  });

  it('does not rewrite an unchanged blocked receipt on every scheduler tick', async () => {
    const {db, writes} = database();
    await approveWorkflowRepair(db, 'action-1', context);
    const repair = {id: 'repair-1', status: 'blocked', error_code: 'VALIDATION_FAILED'};
    await reconcileWorkflowRepairActions(db, repair);
    const before = writes.length;
    await reconcileWorkflowRepairActions(db, repair);
    expect(writes).toHaveLength(before);
  });

  it.each(['resolved', 'closed'])('preserves an independently %s incident', async status => {
    const {db, tables} = database();
    await approveWorkflowRepair(db, 'action-1', context);
    tables.platform_incidents[0].status = status;
    tables.platform_incidents[0].remediation = 'Confirmed resolved by administrator';
    await reconcileWorkflowRepairActions(db, {id: 'repair-1', status: 'verified', release_sha: 'release-sha'});
    expect(tables.platform_incidents[0]).toMatchObject({status, remediation: 'Confirmed resolved by administrator'});
    expect(tables.platform_control_actions[0].status).toBe('completed');
  });

  it('does not reconcile an unrelated repair', async () => {
    const {db, tables} = database();
    await approveWorkflowRepair(db, 'action-1', context);
    await reconcileWorkflowRepairActions(db, {id: 'another-repair', status: 'verified', release_sha: 'different-release'});
    expect(tables.platform_control_actions[0].status).toBe('running');
    expect(tables.platform_incidents[0].status).toBe('identified');
  });

  it('supports platform-scoped incidents only through explicit super-administrator authority', async () => {
    const {db, tables} = database();
    tables.platform_control_actions[0].tenant_id = null;
    tables.platform_incidents[0].tenant_id = null;
    await approveWorkflowRepair(db, 'action-1', {...context, actorRoles: ['super_admin'], tenantId: null});
    await reconcileWorkflowRepairActions(db, {id: 'repair-1', status: 'verified', release_sha: 'release-sha'});
    expect(tables.platform_incidents[0].status).toBe('monitoring');
  });
});
