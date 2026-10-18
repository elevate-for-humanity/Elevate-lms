import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({
  admin: vi.fn(), prepare: vi.fn(), failed: vi.fn(), verified: vi.fn(), sync: vi.fn(),
  runUpdate: vi.fn(), memoryWrites: 0, failWrite: 0, payload: { ok: true } as Record<string, unknown>,
}));
vi.mock('@/lib/devstudio/api-auth', () => ({ apiRequireDevStudio: async () => ({ id: 'admin', effectiveRoles: ['admin'] }) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
vi.mock('@/lib/studio/master-runtime', () => ({ prepareMasterStudioPlan: mocks.prepare }));
vi.mock('@/lib/platform/events', () => ({ emitEvent: async () => {} }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.admin }));
vi.mock('@/lib/devstudio/os/task-runner', () => ({ createAiTask: async () => ({ id: 'task' }), runTaskExecution: vi.fn() }));
vi.mock('@/lib/platform/orchestration/context-service', () => ({ loadSharedContext: async () => null }));
vi.mock('@/lib/ai/tools/registry', () => ({ getAITool: () => null }));
vi.mock('@/lib/utils/siteUrl', () => ({ getAdminUrl: () => 'https://admin.example.test' }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/devstudio/studio-run', () => ({
  bindCanonicalTask: async () => {}, ensureCanonicalStudioRun: async () => ({ id: 'run', stepIds: new Map([['s1', 'step']]) }),
  startCanonicalStudioStep: async () => {}, syncCanonicalStudioRunCheckpoint: mocks.sync,
  verifyCanonicalStudioStep: mocks.verified, failCanonicalStudioStep: mocks.failed,
}));
import { POST } from '@/apps/admin/app/api/admin/dev-studio/plan/route';
beforeEach(() => {
  vi.clearAllMocks(); mocks.memoryWrites = 0; mocks.failWrite = 0; mocks.payload = { ok: true };
  mocks.prepare.mockImplementation(() => ({ id: 'plan', goal: 'Audit the Course Builder', status: 'pending', created_at: '', steps: [{ id: 's1', order: 1, title: 'Health', command: 'Check health', status: 'pending' }] }));
  mocks.admin.mockResolvedValue({ from: (table: string) => {
    if (table === 'studio_runs') return { update: (value: unknown) => { mocks.runUpdate(value); return { eq: async () => ({ error: null }) }; } };
    if (table === 'ai_tasks') return { select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'task', status: 'completed', tool_name: 'devstudio.health', tool_output: mocks.payload, attempts: 1 }, error: null }) }) }) };
    if (table === 'ai_memory') {
      const lookup: Record<string, unknown> = {};
      lookup.eq = () => lookup; lookup.is = () => lookup; lookup.maybeSingle = async () => ({ data: null, error: null });
      return { select: () => lookup, insert: async () => { mocks.memoryWrites += 1; return { error: mocks.memoryWrites === mocks.failWrite ? new Error('checkpoint unavailable') : null }; } };
    }
    throw new Error(`Unexpected table ${table}`);
  } });
});
const execute = async () => (await POST(new NextRequest('https://admin.example.test/api/admin/dev-studio/plan', { method: 'POST', body: JSON.stringify({ goal: 'Audit the Course Builder' }) }))).text();
describe('planner execution and checkpoint reporting', () => {
  it('persists a required failure before reporting the final failed checkpoint', async () => {
    mocks.payload = { ok: false, message: 'Provider unavailable' };
    const text = await execute();
    expect(mocks.failed).toHaveBeenCalled();
    expect(mocks.verified).not.toHaveBeenCalled();
    expect(mocks.sync.mock.calls[0][2].status).toBe('failed');
    expect(text).toContain('failed verification');
    expect(text).toContain('Reason:');
    expect(text).toContain('Provider unavailable');
  });
  it('redacts credentials from failure details shown in the conversation', async () => {
    mocks.payload = { ok: false, message: 'Provider rejected Bearer ghp_privatecredential123' };
    const text = await execute();
    expect(text).toContain('[REDACTED]');
    expect(text).not.toContain('ghp_privatecredential123');
  });
  it('does not relabel a verified task as failed execution when saving its checkpoint fails', async () => {
    mocks.failWrite = 4;
    const text = await execute();
    expect(mocks.verified).toHaveBeenCalledOnce();
    expect(mocks.failed).not.toHaveBeenCalled();
    expect(mocks.runUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed', completed_at: null }));
    expect(text).toContain('checkpoint save failed');
    expect(text).not.toContain('Step 1 failed:');
    expect(text).toContain('"status":"failed"');
  });
  it('reports success only after all steps and durable checkpoints pass', async () => {
    const text = await execute();
    expect(mocks.verified).toHaveBeenCalledOnce();
    expect(mocks.sync.mock.calls[0][2].status).toBe('done');
    expect(text).toContain('Completed and verified: 1/1');
    expect(mocks.runUpdate).not.toHaveBeenCalled();
  });
});
