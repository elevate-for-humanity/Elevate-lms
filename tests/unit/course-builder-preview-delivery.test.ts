import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {NextRequest} from 'next/server';
import {adminPreviewPlaybackUrl} from '@/lib/ultimate-course-builder/media/admin-preview-url.mjs';
const mocks = vi.hoisted(() => ({auth:vi.fn(), db:vi.fn(), sign:vi.fn(),approved:vi.fn()}));
vi.mock('@/lib/admin/guards', () => ({apiRequireAdmin:mocks.auth}));
vi.mock('@/lib/supabase/admin', () => ({requireAdminClient:mocks.db}));
vi.mock('@/lib/storage/lesson-playback', () => ({signedLessonPlayback:mocks.sign}));
vi.mock('@/lib/ultimate-course-builder/media/owner-approved-preview.mjs',()=>({ownerApprovedPreview:mocks.approved}));
import {GET, HEAD} from '@/apps/admin/app/api/admin/ultimate-course-builder/preview/route';
const mediaFetch = vi.fn();
beforeEach(() => {
  mediaFetch.mockReset().mockImplementation(async () => new Response('film', {headers:{'content-type':'video/mp4'}}));
  vi.stubGlobal('fetch', mediaFetch);
});
afterEach(() => vi.unstubAllGlobals());
const buildId='11111111-1111-4111-8111-111111111111',lessonId='22222222-2222-4222-8222-222222222222';
const expired='https://media.example/course-videos/film.mp4?X-Amz-Date=old';
function setup(historical=false) {
  const reads:any[]=[];
  const db={from:(table:string)=>{
    const q:any={select:()=>q,eq:(...args:any[])=>{reads.push([table,...args]);return q;},order:()=>q,limit:()=>q,maybeSingle:()=>Promise.resolve(result()),then:(resolve:any)=>resolve(result())};
    function result(){return {data:table==='ultimate_lesson_builds'?{artifacts:historical?{}:{lesson_film_render:{render:{videoUrl:expired}}}}:table==='ultimate_artifacts'?{id:'saved-render'}:[{content:{render:{videoUrl:expired}}}]};}
    return q;
  }};
  mocks.db.mockResolvedValue(db); return {db,reads};
}
const request=()=>new NextRequest('https://admin.example'+adminPreviewPlaybackUrl(buildId,lessonId,expired));
describe('Admin saved preview delivery',()=>{
  beforeEach(()=>{vi.resetAllMocks();mediaFetch.mockImplementation(async () => new Response('film', {headers:{'content-type':'video/mp4'}}));mocks.auth.mockResolvedValue({id:'admin'});mocks.sign.mockResolvedValue('https://media.example/fresh-signed');});
  it.each([false,true])('renews saved current or historical media without changing the saved build (%s)',async historical=>{
    const {db,reads}=setup(historical); const response=await GET(request());
    expect(response.status).toBe(200);expect(response.headers.get('location')).toBeNull();expect(await response.text()).toBe('film');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(mocks.sign).toHaveBeenCalledWith(db,expired);
    expect(reads).toContainEqual(['ultimate_lesson_builds','id',lessonId]);
    expect(reads).toContainEqual(['ultimate_lesson_builds','build_id',buildId]);
  });
  it('rejects unauthenticated access before reading or signing',async()=>{
    mocks.auth.mockResolvedValue({error:new Response(null,{status:401})});
    expect((await GET(request())).status).toBe(401);expect(mocks.db).not.toHaveBeenCalled();expect(mocks.sign).not.toHaveBeenCalled();
  });
  it('does not use a caller-supplied media URL',async()=>{
    setup();const req=request();req.nextUrl.searchParams.set('source','https://attacker.example/private.mp4');await GET(req);
    expect(mocks.sign.mock.calls[0][1]).toBe(expired);
  });
  it('serves the separately verified published approval instead of the latest draft',async()=>{
    setup();mocks.approved.mockResolvedValue({videoUrl:'https://approved.example/exact.mp4'});
    const req=request();req.nextUrl.searchParams.set('kind','approved');const response=await GET(req);
    expect(response.status).toBe(200);expect(mocks.approved).toHaveBeenCalledOnce();expect(mocks.sign.mock.calls[0][1]).toBe('https://approved.example/exact.mp4');
  });
  it('does not fall back to an unapproved draft when approval no longer matches',async()=>{
    setup();mocks.approved.mockResolvedValue(null);const req=request();req.nextUrl.searchParams.set('kind','approved');
    expect((await GET(req)).status).toBe(404);expect(mocks.sign).not.toHaveBeenCalled();
  });
  it('keeps the player source stable when only a stored signature changes',()=>{
    expect(adminPreviewPlaybackUrl(buildId,lessonId,expired)).toBe(adminPreviewPlaybackUrl(buildId,lessonId,expired.replace('old','fresh')));
    expect(adminPreviewPlaybackUrl(buildId,lessonId,expired)).not.toBe(adminPreviewPlaybackUrl(buildId,lessonId,expired.replace('film.mp4','new-film.mp4')));
  });
});
it('pins preview playback to the displayed immutable artifact version and scopes it to the selected build and lesson',async()=>{
 mocks.auth.mockResolvedValue({id:'admin'});mocks.sign.mockResolvedValue('https://media.example/version-signed');
 const reads:unknown[]=[];
 mocks.db.mockResolvedValue({from:(table:string)=>{
  const q={select:()=>q,eq:(...args:unknown[])=>{reads.push([table,...args]);return q;},maybeSingle:async()=>({data:{id:lessonId,artifacts:{}},error:null}),single:async()=>({data:table==='ultimate_artifacts'?{id:'film'}:{content:{render:{videoUrl:expired}}},error:null})};return q;
 }});
 const req=request();req.nextUrl.searchParams.set('artifactVersionId',lessonId);
 const response=await GET(req);expect(response.status).toBe(200);
 expect(reads).toContainEqual(['ultimate_artifacts','build_id',buildId]);
 expect(reads).toContainEqual(['ultimate_artifacts','lesson_build_id',lessonId]);
 expect(reads).toContainEqual(['ultimate_artifact_versions','artifact_id','film']);
 expect(reads).toContainEqual(['ultimate_artifact_versions','id',lessonId]);
 expect(mocks.sign).toHaveBeenCalledWith(expect.anything(),expired);
});

it('loads canonical published video using only the build/course/lesson scope and ignores caller media sources',async()=>{
 mocks.auth.mockResolvedValue({id:'admin'});mocks.sign.mockClear();mocks.sign.mockResolvedValue('https://media.example/scoped');
 const reads:unknown[]=[],selections:string[]=[];
 mocks.db.mockResolvedValue({from:(table:string)=>{const q={select:(fields:string)=>{selections.push(fields);return q;},eq:(...args:unknown[])=>{reads.push([table,...args]);return q;},
  maybeSingle:async()=>({data:table==='ultimate_course_builds'?{course_id:buildId}:{id:lessonId,video_url:expired},error:null})};return q;}});
 const req=new NextRequest('https://admin.example/api/admin/ultimate-course-builder/preview?'+new URLSearchParams({buildId,canonicalLessonId:lessonId,source:'https://attacker.example'}));
 expect((await GET(req)).status).toBe(200);expect(mocks.sign.mock.calls[0][1]).toBe(expired);
 expect(reads).toContainEqual(['course_lessons','course_id',buildId]);expect(reads).toContainEqual(['course_lessons','id',lessonId]);
 expect(selections.every(value=>!value.includes('artifacts'))).toBe(true);
});
it('cannot sign a canonical video outside the selected course',async()=>{
 mocks.auth.mockResolvedValue({id:'admin'});mocks.sign.mockClear();
 mocks.db.mockResolvedValue({from:(table:string)=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:table==='ultimate_course_builds'?{course_id:buildId}:null,error:null})};return q;}});
 const req=new NextRequest('https://admin.example/api/admin/ultimate-course-builder/preview?'+new URLSearchParams({buildId,canonicalLessonId:lessonId}));
 expect((await GET(req)).status).toBe(404);expect(mocks.sign).not.toHaveBeenCalled();
});

it('streams canonical preview byte ranges without exposing the signed storage URL', async()=>{
 mocks.auth.mockResolvedValue({id:'admin'});mocks.sign.mockResolvedValue('https://media.example/private?token=secret');
 mocks.db.mockResolvedValue({from:(table:string)=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:table==='ultimate_course_builds'?{course_id:buildId}:{id:lessonId,video_url:expired},error:null})};return q;}});
 mediaFetch.mockResolvedValue(new Response('film',{status:206,headers:{'content-type':'video/mp4','content-range':'bytes 0-3/4','content-length':'4','accept-ranges':'bytes'}}));
 const req=new NextRequest('https://admin.example/api/admin/ultimate-course-builder/preview?'+new URLSearchParams({buildId,canonicalLessonId:lessonId}),{headers:{Range:'bytes=0-3'}});
 const response=await GET(req);
 expect(response.status).toBe(206);expect(response.headers.get('content-range')).toBe('bytes 0-3/4');
 expect(response.headers.get('location')).toBeNull();expect(await response.text()).toBe('film');
 expect(mediaFetch).toHaveBeenCalledWith('https://media.example/private?token=secret',expect.objectContaining({headers:{'Accept-Encoding':'identity',Range:'bytes=0-3'}}));
});
it('serves preview HEAD metadata without downloading a video body',async()=>{
 mocks.auth.mockResolvedValue({id:'admin'});mocks.sign.mockResolvedValue('https://media.example/fresh');setup();
 mediaFetch.mockResolvedValue(new Response(null,{headers:{'content-type':'video/mp4','content-length':'40000000'}}));
 const response=await HEAD(new NextRequest(request().url,{method:'HEAD'}));
 expect(response.status).toBe(200);expect(response.body).toBeNull();expect(response.headers.get('content-length')).toBe('40000000');
 expect(mediaFetch.mock.calls[0][1].method).toBe('HEAD');
});
it('reports unavailable preview media without exposing provider details',async()=>{
 mocks.auth.mockResolvedValue({id:'admin'});mocks.sign.mockResolvedValue('https://media.example/private?token=secret');setup();
 mediaFetch.mockResolvedValue(new Response('private provider detail',{status:403}));
 const response=await GET(request());expect(response.status).toBe(503);
 expect(await response.text()).not.toMatch(/token=secret|private provider detail/);
});
