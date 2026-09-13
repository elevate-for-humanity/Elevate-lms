import { describe, expect, it, vi } from 'vitest';
import { executePaidInference, paidArtifactFingerprint } from '@/lib/ai/paid-inference-gateway';

function lifecycleDb() {
  const eq = vi.fn(async () => ({ error: null }));
  const update = vi.fn(() => ({ eq }));
  return { db: { from: vi.fn(() => ({ update })) }, update };
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
      const { db, update } = lifecycleDb();
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
      expect(update).not.toHaveBeenCalled();
    },
  );

  it('records dispatch and completion around one approved provider call', async () => {
    const dispatch = vi.fn(async () => 'ok');
    const { db, update } = lifecycleDb();
    const result = await executePaidInference({
      db: db as never,
      authorize: async () => ({ decision: 'approved', requestId: 'request-1' }),
      dispatch,
    });
    expect(result.value).toBe('ok');
    expect(result.requestId).toBe('request-1');
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith('request-1');
    expect(update).toHaveBeenCalledTimes(2);
  });

  it('records a terminal failure when provider dispatch throws', async () => {
    const { db, update } = lifecycleDb();
    await expect(
      executePaidInference({
        db: db as never,
        authorize: async () => ({ decision: 'approved', requestId: 'request-1' }),
        dispatch: async () => {
          throw new Error('provider unavailable');
        },
      }),
    ).rejects.toThrow('provider unavailable');
    expect(update).toHaveBeenCalledTimes(2);
  });
});
