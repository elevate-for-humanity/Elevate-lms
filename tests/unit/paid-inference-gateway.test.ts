import { describe, expect, it, vi } from 'vitest';
import { approvePaidInference, executePaidInference, paidArtifactFingerprint } from '@/lib/ai/paid-inference-gateway';

function lifecycleDb() {
  const rpc = vi.fn(async (name: string) => ({
    data: name === 'claim_paid_inference_dispatch_v1' || name === 'finish_paid_inference_v1',
    error: null,
  }));
  return { db: { rpc }, rpc };
}

describe('paid inference gateway', () => {
  it('canonicalizes nested fingerprints without collapsing distinct prompts', () => {
    expect(
      paidArtifactFingerprint({ request: { script: 'same', voice: { id: 'one' } } }),
    ).toBe(
      paidArtifactFingerprint({ request: { voice: { id: 'one' }, script: 'same' } }),
    );
    expect(
      paidArtifactFingerprint({ request: { script: 'first', voice: { id: 'one' } } }),
    ).not.toBe(
      paidArtifactFingerprint({ request: { script: 'second', voice: { id: 'one' } } }),
    );
  });

  it.each(['cache_hit', 'duplicate', 'paused', 'budget_exceeded', 'approval_required'] as const)(
    'makes zero provider calls for %s',
    async (decision) => {
      const dispatch = vi.fn();
      const { db, rpc } = lifecycleDb();
      expect(
        (
          await executePaidInference({
            db: db as never,
            authorize: async () => ({ decision, requestId: null }),
            dispatch,
          })
        ).decision,
      ).toBe(decision);
      expect(dispatch).not.toHaveBeenCalled();
      expect(rpc).not.toHaveBeenCalled();
    },
  );

  it('records dispatch and completion around one approved provider call', async () => {
    const dispatch = vi.fn(async () => 'ok');
    const { db, rpc } = lifecycleDb();
    const result = await executePaidInference({
      db: db as never,
      authorize: async () => ({ decision: 'approved', requestId: 'request-1' }),
      dispatch,
    });
    expect(result.value).toBe('ok');
    expect(result.requestId).toBe('request-1');
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith('request-1');
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc.mock.calls[0]?.[0]).toBe('claim_paid_inference_dispatch_v1');
    expect(rpc.mock.calls[1]?.[0]).toBe('finish_paid_inference_v1');
  });

  it('records a terminal failure when provider dispatch throws', async () => {
    const { db, rpc } = lifecycleDb();
    await expect(
      executePaidInference({
        db: db as never,
        authorize: async () => ({ decision: 'approved', requestId: 'request-1' }),
        dispatch: async () => {
          throw new Error('provider unavailable');
        },
      }),
    ).rejects.toThrow('provider unavailable');
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it('approves exactly one durable request without dispatching it', async () => {
    const { db, rpc } = lifecycleDb();
    await expect(approvePaidInference(db as never, 'request-1', 'admin-1')).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith('approve_paid_inference_v1', {
      p_request_id: 'request-1',
      p_approved_by: 'admin-1',
    });
  });
});
