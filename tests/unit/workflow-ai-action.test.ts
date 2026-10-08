import { describe, it, expect, vi, beforeEach } from 'vitest';
const state = vi.hoisted(() => ({
  ai: vi.fn(),
  db: vi.fn(),
}));
vi.mock('@/lib/ai/ai-service', () => ({ aiChat: state.ai }));
vi.mock('@/lib/studio/master-runtime', () => ({ recordMasterStudioArtifact: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: state.db }));
vi.mock('@/lib/platform/events', () => ({ emitEvent: vi.fn() }));
vi.mock('@/lib/email/service', () => ({ sendEmail: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
import { executeWorkflow } from '@/lib/workflows/engine';

function setup(config: Record<string, unknown>, persisted: { data: unknown; error: unknown } = { data: [{ summary: 'Approved answer' }], error: null }) {
  const writes: unknown[] = [];
  state.db.mockResolvedValue({
    from(table: string) {
      if (table === 'workflow_steps') return {
        select: () => ({ eq: () => ({ eq: () => ({ order: async () => ({
          data: [{ id: 'step', workflow_id: 'workflow', action_type: 'ai_action', action_config: config, step_order: 1, enabled: true }],
          error: null,
        }) }) }) }),
      };
      if (table === 'leads') return {
        update(values: unknown) {
          writes.push(values);
          return { match: () => ({ ...persisted, select: async () => persisted }) };
        },
      };
      return {
        insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'run' }, error: null }) }), then: (resolve: (value: { error: null }) => unknown) => Promise.resolve({ error: null }).then(resolve) }),
        update: () => ({ eq: async () => ({ error: null }) }),
      };
    },
  });
  return writes;
}

describe('workflow AI result verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.ai.mockResolvedValue({ content: 'Approved answer', provider: 'configured', task: 'general_chat' });
  });
  it('uses the canonical AI entry point and persists text rather than the response object', async () => {
    const writes = setup({ prompt: 'Explain {{topic}}', persist_table: 'leads', persist_match: { id: '{{id}}' }, persist_field: 'summary' });
    const result = await executeWorkflow('workflow', 'manual', { topic: 'HVAC', id: 'record' });
    expect(result.status).toBe('success');
    expect(state.ai).toHaveBeenCalledWith({ messages: [expect.objectContaining({ role: 'system' }), { role: 'user', content: 'Explain HVAC' }] });
    expect(writes).toEqual([{ summary: 'Approved answer' }]);
  });
  it.each([
    { content: '', provider: 'configured' },
    { content: '   ', provider: 'configured' },
    { content: undefined, provider: 'configured' },
  ])('rejects unusable AI result %j', async response => {
    setup({ prompt: 'Explain HVAC' });
    state.ai.mockResolvedValue(response);
    const result = await executeWorkflow('workflow', 'manual');
    expect(result.status).toBe('failed');
  });
  it.each(['{bad json', '{}', '[]', 'null'])('rejects unsafe persistence match %s without writing data', async match => {
    const writes = setup({ prompt: 'Explain HVAC', persist_table: 'leads', persist_match: match, persist_field: 'summary' });
    expect((await executeWorkflow('workflow', 'manual')).status).toBe('failed');
    expect(writes).toEqual([]);
  });
  it.each([
    { data: null, error: { message: 'Database unavailable' } },
    { data: [], error: null },
    { data: [{ summary: 'Wrong answer' }], error: null },
  ])('fails when persistence cannot be verified %j', async persisted => {
    setup({ prompt: 'Explain HVAC', persist_table: 'leads', persist_match: { id: 'record' }, persist_field: 'summary' }, persisted);
    expect((await executeWorkflow('workflow', 'manual')).status).toBe('failed');
  });
  it('allows a valid result without persistence', async () => {
    setup({ prompt: 'Explain HVAC' });
    expect((await executeWorkflow('workflow', 'manual')).status).toBe('success');
  });
  it('preserves the mutation-table allowlist', async () => {
    const writes = setup({ prompt: 'Explain HVAC', persist_table: 'private_records', persist_match: { id: 'record' }, persist_field: 'summary' });
    expect((await executeWorkflow('workflow', 'manual')).status).toBe('failed');
    expect(writes).toEqual([]);
  });
});
