// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m=vi.hoisted(()=>({access:vi.fn(),client:vi.fn(),rate:vi.fn(),user:{id:'learner'} as {id:string}|null}));
vi.mock('@/lib/auth/requireAuth',()=>({requireAuth:async()=>({user:m.user,error:null})}));
vi.mock('@/lib/supabase/server',()=>({createClient:m.client}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:m.rate}));
vi.mock('@/lib/lms/access-control',async original=>({...await original<typeof import('@/lib/lms/access-control')>(),assertLessonAccess:m.access}));
import {GET,POST} from '@/apps/lms/app/api/learner/interactions/route';
const courseId='11111111-1111-4111-8111-111111111111',lessonId='22222222-2222-4222-8222-222222222222';
beforeEach(()=>{vi.clearAllMocks();m.user={id:'learner'};m.rate.mockResolvedValue(null);m.access.mockRejectedValue(new Error('ACCESS_DENIED'));});
it('blocks locked lesson data before reading authored content',async()=>{
 const r=await GET(new NextRequest(`https://app.elevateforhumanity.org/api/learner/interactions?courseId=${courseId}&lessonId=${lessonId}`));
 expect(r.status).toBe(403);expect(r.headers.get('cache-control')).toBe('private, no-store');expect(m.client).not.toHaveBeenCalled();
});
it.each([{learningObjectId:'object'}, {interactionId:'quiz',interactionType:'knowledge-check',responses:[0]}])('blocks locked lesson progress writes %j',async body=>{
 const r=await POST(new NextRequest('https://app.elevateforhumanity.org/api/learner/interactions',{method:'POST',body:JSON.stringify({courseId,lessonId,...body})}));
 expect(r.status).toBe(403);expect(m.client).not.toHaveBeenCalled();
});
it('requires sign-in before probing lesson access',async()=>{m.user=null;
 expect((await GET(new NextRequest(`https://app.elevateforhumanity.org/api/learner/interactions?courseId=${courseId}&lessonId=${lessonId}`))).status).toBe(401);expect(m.access).not.toHaveBeenCalled();
});
it('enforces account-based rate limiting before reading the lesson',async()=>{m.rate.mockResolvedValue(new Response('{}',{status:429}));
 expect((await GET(new NextRequest(`https://app.elevateforhumanity.org/api/learner/interactions?courseId=${courseId}&lessonId=${lessonId}`))).status).toBe(429);expect(m.access).not.toHaveBeenCalled();expect(m.client).not.toHaveBeenCalled();
});
