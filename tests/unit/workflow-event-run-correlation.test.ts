import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ db: vi.fn(), ai: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.db }));
vi.mock('@/lib/ai/ai-service', () => ({ aiChat: mocks.ai }));
vi.mock('@/lib/studio/master-runtime', () => ({ recordMasterStudioArtifact: vi.fn() }));
vi.mock('@/lib/platform/events', () => ({ emitEvent: vi.fn() }));
vi.mock('@/lib/email/service', () => ({ sendEmail: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
import { executeWorkflow } from '@/lib/workflows/engine';

function database(duplicate = false) {
  const insertedRuns: unknown[] = [];
  mocks.db.mockResolvedValue({
    from(table: string) {
      if (table === 'workflow_steps') return {
        select: () => ({ eq: () => ({ eq: () => ({ order: async () => ({
          data: [{ id: 'step-1', workflow_id: 'workflow-1', action_type: 'ai_action', action_config: { prompt: 'Draft a report' }, step_order: 1, enabled: true }], error: null,
        }) }) }) }),
      };
      const builder: any = {
        insert(values: unknown) { if (table === 'workflow_runs') insertedRuns.push(values); return builder; },
        select() { return builder; },
        single: async () => duplicate ? { data: null, error: { code: '23505', message: 'Duplicate workflow event run' } } : { data: { id: 'run-1' }, error: null },
        update() { return builder; },
        eq() { return builder; },
        then(resolve: any, reject: any) { return Promise.resolve({ error: null }).then(resolve, reject); },
      };
      return builder;
    },
  });
  return insertedRuns;
}

describe('workflow event run claim', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.ai.mockResolvedValue({ content: 'Completed report' }); });

  it('includes the durable event ID in the first run insert before executing any step', async () => {
    const inserted = database();
    mocks.ai.mockImplementation(async () => {
      expect(inserted).toEqual([expect.objectContaining({ platform_event_id: 'event-1', workflow_id: 'workflow-1', status: 'running' })]);
      return { content: 'Completed report' };
    });
    expect((await executeWorkflow('workflow-1', 'schedule', {}, 'trigger-1', undefined, 'tenant-1', undefined, { platformEventId: 'event-1' })).status).toBe('success');
    expect(mocks.ai).toHaveBeenCalledTimes(1);
  });

  it('does not execute a step when the unique event/workflow run already exists', async () => {
    database(true);
    const result = await executeWorkflow('workflow-1', 'schedule', {}, 'trigger-1', undefined, 'tenant-1', undefined, { platformEventId: 'event-1' });
    expect(result).toMatchObject({ status: 'failed', stepsRun: 0, runId: '' });
    expect(mocks.ai).not.toHaveBeenCalled();
  });
});
