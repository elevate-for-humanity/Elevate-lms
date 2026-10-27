import {beforeEach, expect, it, vi} from 'vitest';

const writes = vi.hoisted(() => [] as Array<{table: string; row: Record<string, unknown>}>);
vi.mock('@supabase/supabase-js', () => ({createClient: () => ({
  from(table: string) {
    const query: any = {
      insert(row: Record<string, unknown>) {writes.push({table, row}); return query;},
      select() {return query;},
      single: async () => ({data: {id: 'action-1'}, error: null}),
      then: (resolve: any, reject: any) => Promise.resolve({data: null, error: null}).then(resolve, reject),
    };
    return query;
  },
})}));

import {executeControlAction} from '@/lib/control-plane';

beforeEach(() => {writes.length = 0;});

it('persists a pending approval when a workflow repair is requested through the control plane', async () => {
  const parameters = {incident_id: 'incident-1', devstudio_job_id: 'diagnostic-1'};
  const result = await executeControlAction('tenant-1', 'requester-1', 'workflow_repair', parameters);
  expect(result).toMatchObject({success: true, action_id: 'action-1', requires_approval: true});
  expect(writes.find(write => write.table === 'platform_control_actions')?.row).toMatchObject({
    action_type: 'workflow_repair', tenant_id: 'tenant-1', triggered_by: 'requester-1',
    status: 'pending', approval_status: 'pending', requires_approval: true, parameters,
  });
  expect(writes.some(write => write.table === 'paris_code_repairs')).toBe(false);
});
