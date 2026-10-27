import {afterEach,describe,expect,it,vi} from 'vitest';
import {fetchAiHealth} from '@/lib/devstudio/ellie-unified-handlers';
afterEach(()=>vi.unstubAllGlobals());
describe('Paris default provider readiness',()=>{
 it('does not present configured outside providers as healthy private inference',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({aiConfigured:true,hasOpenAI:true,hasXAI:true,hasElevate:false})}));
  const result=await fetchAiHealth();
  expect(result.ok).toBe(false);expect(result.label).toBe('Private model unavailable');expect(result.providers.openai).toBe(true);
 });
 it('labels authenticated owned model discovery as reachable',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({aiConfigured:true,hasElevate:true})}));
  expect(await fetchAiHealth()).toMatchObject({ok:true,label:'Private model verified reachable'});
 });
});
