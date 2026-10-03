import {describe,it,expect,vi,afterEach} from 'vitest';
vi.mock('server-only',()=>({}));
vi.mock('@/lib/secrets',()=>({hydrateProcessEnv:vi.fn(async()=>undefined)}));
import {executeStudioCommand} from '@/lib/studio/runtime-command';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
function configure(){vi.stubEnv('STUDIO_BROWSER_URL','https://studio.example');vi.stubEnv('STUDIO_BROWSER_SECRET','private-test-key');}
describe('existing Studio command container',()=>{
 it('synchronizes LMS and delivers the exact command to the existing runtime',async()=>{
  configure();const fetcher=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({ok:true,sha:'current'})})
   .mockResolvedValueOnce({ok:true,json:async()=>({stdout:'main',stderr:'',exitCode:0})});vi.stubGlobal('fetch',fetcher);
  expect(await executeStudioCommand('git status --short')).toEqual({stdout:'main',stderr:'',exitCode:0});
  expect(JSON.parse(fetcher.mock.calls[0][1].body).repoUrl).toBe('https://github.com/elevate-for-humanity/Elevate-lms.git');
  expect(fetcher.mock.calls[1][0]).toBe('https://studio.example/workspace/exec');
  expect(JSON.parse(fetcher.mock.calls[1][1].body).command).toBe('git status --short');
 });
 it('propagates container failure instead of reporting successful execution',async()=>{
  configure();vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:503,json:async()=>({error:'not_ready'})}));
  await expect(executeStudioCommand('git status')).rejects.toThrow('HTTP 503');
 });
 it('keeps a real nonzero process result and rejects missing execution evidence',async()=>{
  configure();vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({ok:true})})
   .mockResolvedValueOnce({ok:true,json:async()=>({stdout:'',stderr:'test failed',exitCode:2})}));
  expect((await executeStudioCommand('git status')).exitCode).toBe(2);
 });
});
