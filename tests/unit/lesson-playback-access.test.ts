// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const m=vi.hoisted(()=>({user:null as null|{id:string},preview:false,access:vi.fn(),sign:vi.fn(),rate:vi.fn(),admin:vi.fn(),lesson:{video_url:'saved-source.mp4',content_json:{}} as null|{video_url:string;content_json:Record<string,unknown>;film_duration?:number;film_cues?:unknown;film_transcript?:string}}));
vi.mock('@/lib/auth',()=>({getCurrentUser:async()=>m.user}));
vi.mock('@/lib/admin/course-preview',()=>({resolveCoursePreview:async()=>({active:m.preview,db:null})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:m.admin}));
vi.mock('@/lib/storage/lesson-playback',()=>({signedLessonPlayback:m.sign}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:m.rate}));
vi.mock('@/lib/lms/access-control',async original=>({...await original<typeof import('@/lib/lms/access-control')>(),assertLessonAccess:m.access}));
import {GET} from '@/apps/lms/app/api/courses/[courseId]/lessons/[lessonId]/playback/route';
const run=(asset='')=>GET(new Request('https://app.elevateforhumanity.org/api/courses/course/lessons/lesson/playback'+(asset?'?asset='+asset:'')),{params:Promise.resolve({courseId:'course',lessonId:'lesson'})});
beforeEach(()=>{vi.clearAllMocks();m.user={id:'student'};m.preview=false;m.lesson={video_url:'saved-source.mp4',content_json:{}};m.rate.mockResolvedValue(null);m.access.mockResolvedValue(undefined);m.sign.mockResolvedValue('https://storage.example/signed-video');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('film',{headers:{'content-type':'video/mp4','content-length':'4'}})));
 const query={select:()=>query,eq:()=>query,maybeSingle:async()=>({data:m.lesson,error:null})};m.admin.mockResolvedValue({from:()=>query});
});
it('does not sign or query storage for anonymous requests',async()=>{m.user=null;expect((await run()).status).toBe(401);expect(m.sign).not.toHaveBeenCalled();expect(m.admin).not.toHaveBeenCalled();});
it('rejects locked lessons before signing or privileged database access',async()=>{m.access.mockRejectedValue(new Error('ACCESS_DENIED'));expect((await run()).status).toBe(403);expect(m.sign).not.toHaveBeenCalled();expect(m.admin).not.toHaveBeenCalled();});
afterEach(()=>vi.unstubAllGlobals());
it('streams media privately after verifying access without revealing the bearer URL',async()=>{const response=await run();expect(response.status).toBe(200);expect(response.headers.get('location')).toBeNull();expect(await response.text()).toBe('film');expect(response.headers.get('cache-control')).toBe('private, no-store');expect(m.access).toHaveBeenCalledWith('student','lesson');expect(m.sign).toHaveBeenCalledWith(expect.any(Object),'saved-source.mp4');});
it('does not sign when the lesson does not belong to the requested course',async()=>{m.lesson=null;expect((await run()).status).toBe(404);expect(m.sign).not.toHaveBeenCalled();});
it('stops rate-limited requests before database reads or signing',async()=>{m.rate.mockResolvedValue(new Response('{}',{status:429}));expect((await run()).status).toBe(429);expect(m.admin).not.toHaveBeenCalled();expect(m.sign).not.toHaveBeenCalled();});
it('does not leak signing secrets on a provider failure',async()=>{m.sign.mockRejectedValue(new Error('secret token'));const response=await run();expect(response.status).toBe(503);expect(await response.text()).not.toContain('secret token');});

it('protects measured captions and transcript with the same learner access boundary',async()=>{
 m.lesson={video_url:'saved-source.mp4',content_json:{},film_duration:10,film_cues:[{start:1.25,end:2.5,text:'Cleaning removes visible debris.'}],film_transcript:'Cleaning removes visible debris.'};
 const captions=await run('captions');expect(captions.status).toBe(200);expect(captions.headers.get('content-type')).toContain('text/vtt');expect(await captions.text()).toContain('00:00:01.250 --> 00:00:02.500');
 const transcript=await run('transcript');expect(await transcript.text()).toBe('Cleaning removes visible debris.');
 expect(m.access).toHaveBeenCalledTimes(2);expect(m.sign).not.toHaveBeenCalled();
 m.access.mockRejectedValue(new Error('ACCESS_DENIED'));expect((await run('captions')).status).toBe(403);expect((await run('transcript')).status).toBe(403);
});
it('fails closed on malformed measured captions and unknown asset requests',async()=>{
 m.lesson={video_url:'saved-source.mp4',content_json:{},film_duration:10,film_cues:[{start:1,end:3,text:'first'},{start:2,end:4,text:'overlap'}]};
 expect((await run('captions')).status).toBe(404);expect((await run('other')).status).toBe(400);expect(m.sign).not.toHaveBeenCalled();
});
