// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const m=vi.hoisted(()=>({send:vi.fn(),configured:true}));
vi.mock('@/lib/storage/elevate-media-storage',()=>({getElevateMediaStorageConfig:()=>({provider:'backblaze-b2',endpoint:'https://s3.us-east-005.backblazeb2.com',bucket:'elevate-course-media'}),isElevateMediaStorageConfigured:()=>m.configured,getElevateMediaStorageClient:()=>({send:m.send})}));
import { checkLessonMediaStorage } from '@/lib/storage/lesson-media-health';
beforeEach(()=>{m.configured=true;m.send.mockReset();});
it('requires actual owner-only bucket ACL evidence before green',async()=>{
 m.send.mockResolvedValue({Owner:{ID:'owner'},Grants:[{Grantee:{Type:'CanonicalUser',ID:'owner'},Permission:'FULL_CONTROL'}]});
 expect((await checkLessonMediaStorage()).status).toBe('healthy');
 m.send.mockResolvedValue({Owner:{ID:'owner'},Grants:[{Grantee:{Type:'Group',URI:'http://acs.amazonaws.com/groups/global/AllUsers'},Permission:'READ'}]});
 expect((await checkLessonMediaStorage()).status).toBe('degraded');
});
it('does not infer privacy from missing ACLs or credentials',async()=>{
 m.send.mockResolvedValue({});expect((await checkLessonMediaStorage()).status).toBe('degraded');
 m.configured=false;expect((await checkLessonMediaStorage()).status).toBe('unknown');
});
it('contains upstream failures without disclosing credentials',async()=>{
 m.send.mockRejectedValue(Error('private-token'));const result=await checkLessonMediaStorage();expect(result.status).toBe('degraded');expect(JSON.stringify(result)).not.toContain('private-token');
});
