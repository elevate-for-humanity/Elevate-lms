import {beforeEach,expect,it,vi} from 'vitest';
const h=vi.hoisted(()=>({original:'original-repair' as string|null,upsert:vi.fn(),lookupError:null as Error|null}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({from:()=>{
 const q:any={select:()=>q,eq:()=>q,order:()=>q,limit:()=>q,maybeSingle:async()=>({data:h.original?{id:h.original}:null,error:h.lookupError}),upsert:(row:any)=>{h.upsert(row);return {select:()=>({maybeSingle:async()=>({data:{id:'new-repair'},error:null})})};}};return q;
}})}));
vi.mock('@/lib/devstudio/github-token',()=>({getGitHubHeaders:async()=>({})}));
import {enqueueParisRepair} from '@/lib/ai/runtime/code-repair';
beforeEach(()=>{h.original='original-repair';h.lookupError=null;h.upsert.mockReset();});
it('reuses the original source-job receipt across unrelated main SHAs',async()=>{
 for(const fingerprint of ['course:source:quality:sha-a','course:source:quality:sha-b'])expect(await enqueueParisRepair({actorId:'owner',goal:'inspect',sourceJobId:'source',fingerprint})).toEqual({id:'original-repair'});
 expect(h.upsert).not.toHaveBeenCalled();
});
it('new source repairs use one durable key without a source-release suffix',async()=>{
 h.original=null;
 expect(await enqueueParisRepair({actorId:'owner',goal:'inspect',sourceJobId:'source',fingerprint:'legacy-sha-key'})).toEqual({id:'new-repair'});
 expect(h.upsert).toHaveBeenCalledWith(expect.objectContaining({fingerprint:'course:source:quality',source_job_id:'source'}));
});
it('does not create a duplicate if the existing-source lookup fails',async()=>{
 h.lookupError=Error('lookup failed');
 await expect(enqueueParisRepair({actorId:'owner',goal:'inspect',sourceJobId:'source'})).rejects.toThrow('lookup failed');
 expect(h.upsert).not.toHaveBeenCalled();
});
