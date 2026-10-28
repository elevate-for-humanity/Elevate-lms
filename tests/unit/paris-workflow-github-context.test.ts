import {afterEach,expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
vi.mock('@/lib/secrets',()=>({getDecryptedPlatformSecret:async()=> 'stored-platform-token'}));
import {withWorkflowGitHubToken,currentWorkflowGitHubToken} from '@/lib/devstudio/workflow-github-context';
import {getGitHubToken} from '@/lib/devstudio/github-token';
afterEach(()=>vi.unstubAllGlobals());
it('temporary workflow identity overrides shared credentials only for its request',async()=>{
 const before=process.env.GITHUB_TOKEN;
 const fetchMock=vi.fn().mockResolvedValue({ok:true,status:200});
 vi.stubGlobal('fetch',fetchMock);
 expect(await getGitHubToken()).toBe('stored-platform-token');
 const values=await Promise.all(['workflow-token-one-123456','workflow-token-two-123456'].map(token=>withWorkflowGitHubToken(token,async()=>{await Promise.resolve();return getGitHubToken();})));
 expect(fetchMock).toHaveBeenCalledTimes(1);
 expect(fetchMock).toHaveBeenCalledWith('https://api.github.com/repos/elevate-for-humanity/Elevate-lms/git/ref/heads/main',expect.objectContaining({headers:expect.objectContaining({Authorization:'Bearer stored-platform-token'}),cache:'no-store',redirect:'error'}));
 expect(values).toEqual(['workflow-token-one-123456','workflow-token-two-123456']);
 expect(currentWorkflowGitHubToken()).toBeUndefined();expect(await getGitHubToken()).toBe('stored-platform-token');expect(process.env.GITHUB_TOKEN).toBe(before);expect(fetchMock).toHaveBeenCalledTimes(2);
});
it('missing or malformed temporary authorization cannot run work',async()=>{
 const work=vi.fn();for(const token of ['', 'short', 'invalid token with spaces'])await expect(withWorkflowGitHubToken(token,work)).rejects.toThrow('TOKEN_REQUIRED');
 expect(work).not.toHaveBeenCalled();
});
