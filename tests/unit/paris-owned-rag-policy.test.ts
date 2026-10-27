import {afterEach,describe,expect,it,vi} from 'vitest';
import {getRAGContext,retrieveContext} from '@/lib/platform/rag';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('owned-only knowledge retrieval',()=>{
 it('never transmits the private query to vendor embeddings even when a vendor key is configured',async()=>{
  vi.stubEnv('OPENAI_API_KEY','test-key');
  const request=vi.fn();vi.stubGlobal('fetch',request);
  expect(await getRAGContext('private test query',{providerPolicy:'owned-only'})).toBe('');
  expect(await retrieveContext('private test query',5,0.65,{providerPolicy:'owned-only'})).toBe('');
  expect(request).not.toHaveBeenCalled();
  vi.stubEnv('AI_PROVIDER','elevate');
  expect(await getRAGContext('private default-provider query')).toBe('');
  expect(request).not.toHaveBeenCalled();
 });
});
