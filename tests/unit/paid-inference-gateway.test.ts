import { describe, expect, it, vi } from 'vitest';
import { executePaidInference, paidArtifactFingerprint } from '@/lib/ai/paid-inference-gateway';

describe('paid inference gateway', () => {
  it('generates deterministic fingerprints independent of key order', () => {
    expect(paidArtifactFingerprint({script:'same',voice:'one'})).toBe(paidArtifactFingerprint({voice:'one',script:'same'}));
  });
  it.each(['cache_hit','duplicate','paused','budget_exceeded','approval_required'] as const)('makes zero provider calls for %s', async decision => {
    const dispatch=vi.fn();
    expect((await executePaidInference({authorize:async()=>({decision,requestId:null}),dispatch})).decision).toBe(decision);
    expect(dispatch).not.toHaveBeenCalled();
  });
  it('dispatches once only after an approved durable request exists', async () => {
    const dispatch=vi.fn(async()=> 'ok');
    const result=await executePaidInference({authorize:async()=>({decision:'approved',requestId:'request-1'}),dispatch});
    expect(result.value).toBe('ok'); expect(dispatch).toHaveBeenCalledTimes(1); expect(dispatch).toHaveBeenCalledWith('request-1');
  });
});
