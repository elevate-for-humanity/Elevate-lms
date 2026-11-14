import {beforeEach,expect,it,vi} from 'vitest';
import {NextRequest,NextResponse} from 'next/server';
const mocks=vi.hoisted(()=>({auth:vi.fn(),db:vi.fn(),list:vi.fn(),sign:vi.fn(),rows:[] as any[]}));
vi.mock('@/lib/admin/guards',()=>({apiRequireAdmin:mocks.auth}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:mocks.db}));
vi.mock('@/lib/storage/elevate-media-storage',()=>({isElevateMediaStorageConfigured:()=>false,getElevateMediaStorageClient:vi.fn(),getElevateMediaStorageConfig:vi.fn()}));
import {GET} from '@/apps/admin/app/api/admin/ultimate-course-builder/segments/route';
const buildId='572cca43-6bd6-4a91-b385-a8b576209c4e',lessonBuildId='411fd0ab-f781-41cf-a4a9-888cdf4fdeaa',canonicalId='a3cc313b-beee-453c-84af-f84cf3bbead7';
const request=()=>new NextRequest(`https://admin.elevateforhumanity.org/api/admin/ultimate-course-builder/segments?buildId=${buildId}&lessonBuildId=${lessonBuildId}&key=another-tenant.mp4`);
beforeEach(()=>{vi.clearAllMocks();mocks.auth.mockResolvedValue({user:{id:'admin'}});mocks.rows=[];
 mocks.db.mockResolvedValue({from:()=>{const query:any={select:()=>query,eq:()=>query,maybeSingle:async()=>mocks.rows.shift()};return query;},storage:{from:()=>({list:mocks.list,createSignedUrl:mocks.sign})}});
});
it('rejects unauthenticated requests before accessing storage or database',async()=>{
 mocks.auth.mockResolvedValue({error:NextResponse.json({error:'Unauthorized'},{status:401})});
 expect((await GET(request())).status).toBe(401);expect(mocks.db).not.toHaveBeenCalled();expect(mocks.sign).not.toHaveBeenCalled();
});
it('only signs server-resolved current lesson checkpoints, ignoring client object keys',async()=>{
 const fingerprint='a'.repeat(24);
 mocks.rows=[{data:{profile:{canonicalLessonIds:{competency:canonicalId}}}},{data:{competency_id:'competency',status:'running'}},{data:{state:'running',started_at:'2026-10-18T11:00:00Z'}}];
 mocks.list.mockResolvedValueOnce({data:[{name:fingerprint}]}).mockResolvedValueOnce({data:[{name:'0-899.mp4',updated_at:'2026-10-18T11:47:00Z',metadata:{size:100}},{name:'1800-2699.mp4',updated_at:'2026-10-18T11:49:00Z',metadata:{size:100}}]});
 mocks.sign.mockResolvedValue({data:{signedUrl:'https://storage.example/signed-current-portion'}});
 const response=await GET(request()),result=await response.json();
 expect(response.status).toBe(200);expect(result.segments).toHaveLength(1);expect(result.mediaApproved).toBe(false);
 expect(mocks.sign).toHaveBeenCalledExactlyOnceWith(`course-render-checkpoints/${canonicalId}/${fingerprint}/0-899.mp4`,1800);
 expect(response.headers.get('cache-control')).toBe('private, no-store');
});
