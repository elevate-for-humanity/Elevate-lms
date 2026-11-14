import {beforeEach,expect,it,vi} from 'vitest';
const h=vi.hoisted(()=>({decision:'budget_exceeded',inferences:0}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/logger',()=>({logger:{error:vi.fn(),warn:vi.fn(),info:vi.fn()}}));
vi.mock('@/lib/secrets',()=>({hydrateProcessEnv:async()=>{}}));
vi.mock('@/lib/devstudio/github-token',()=>({getGitHubHeaders:async()=>({Authorization:'Bearer test-only'})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({rpc:async(name:string)=>({data:name==='reserve_paid_inference_v1'?[{decision:h.decision,request_id:'00000000-0000-4000-8000-000000000001'}]:true,error:null})})}));
vi.mock('@/lib/ai/ai-service',()=>({aiChat:vi.fn(async()=>{const {requirePaidInferenceContext}=await import('@/lib/ai/paid-inference-context');expect(requirePaidInferenceContext('test')).toBe('00000000-0000-4000-8000-000000000001');h.inferences++;return {content:'{"type":"complete","summary":"No edit was necessary."}',provider:'openai'};})}));
import {stageParisCodeRepair} from '@/lib/devstudio/paris-code-engineer';
beforeEach(()=>{h.decision='budget_exceeded';h.inferences=0;vi.stubEnv('AI_PROVIDER','openai');vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({object:{sha:'a'.repeat(40)}}))));});
it('an inference budget rejection prevents any model dispatch',async()=>{
 const response=await stageParisCodeRepair('inspect the known bug',undefined,'owner');
 expect(response.status).toBe(500);expect(h.inferences).toBe(0);
 expect((await response.json()).error).toBe('PARIS_INFERENCE_BUDGET_EXCEEDED');
});
it('uses the configured shared model only inside its authorized spending context',async()=>{
 h.decision='approved';const response=await stageParisCodeRepair('inspect only',undefined,'owner');
 expect(h.inferences).toBe(1);expect(response.status).toBe(422);
 expect((await response.json()).error).toContain('without a verifiable repository change');
});
it('requires an identified operator before creating a repository task',async()=>{
 const response=await stageParisCodeRepair('fix it');expect(response.status).toBe(403);expect(fetch).not.toHaveBeenCalled();
});
