// @vitest-environment node
import {afterEach, expect, it, vi} from 'vitest';
const observed = vi.hoisted(() => vi.fn());
vi.mock('@/lib/ai/runtime/supervision', () => ({recordParisObservation: observed}));
import {aiChat} from '@/lib/ai/ai-service';

afterEach(() => {vi.unstubAllEnvs();vi.unstubAllGlobals();vi.clearAllMocks();});

it('correlates a denied inference to its original task without calling the external provider', async () => {
  vi.stubEnv('AI_PROVIDER','openai');
  vi.stubEnv('OPENAI_API_KEY','unit-test-placeholder');
  const request=vi.fn();
  vi.stubGlobal('fetch',request);
  await expect(aiChat({provider:'openai',correlationId:'existing-repair-id',messages:[{role:'user',content:'private prompt'}]})).rejects.toThrow('PAID_INFERENCE_AUTHORIZATION_REQUIRED');
  expect(request).not.toHaveBeenCalled();
  expect(observed).toHaveBeenCalledWith(expect.objectContaining({provider:'openai',correlationId:'existing-repair-id',status:'failed'}));
  expect(JSON.stringify(observed.mock.calls)).not.toContain('private prompt');
});
