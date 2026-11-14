import {expect,it,vi,beforeEach} from 'vitest';
const h=vi.hoisted(()=>({auth:vi.fn(),edit:vi.fn(),optimize:vi.fn(),describe:vi.fn(),persist:vi.fn(),reserve:vi.fn(),execute:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/admin/guards',()=>({apiRequireAdmin:h.auth}));
vi.mock('@/lib/admin/resolve-admin-organization',()=>({resolveAdminOrganization:async()=>({organizationId:'org',userId:'admin'})}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:async()=>null}));
vi.mock('@/lib/api/safe-error',()=>({safeInternalError:()=>Response.json({ok:false},{status:500})}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({})}));
vi.mock('@/lib/secrets',()=>({hydrateProcessEnv:async()=>{}}));
vi.mock('@/lib/media/image-operations',()=>({editImageBytes:h.edit,optimizeImageBytes:h.optimize,describeImageBytes:h.describe}));
vi.mock('@/lib/media/studio-assets',()=>({persistStudioAsset:h.persist}));
vi.mock('@/lib/ai/paid-inference-gateway',()=>({reservePaidInference:h.reserve,executePaidInference:h.execute,paidArtifactFingerprint:()=> 'fingerprint'}));
import {POST} from '@/apps/admin/app/api/admin/media-studio/image/transform/route';
import {NextRequest} from 'next/server';
const request=(body:unknown)=>new NextRequest('https://admin.example.test/api/admin/media-studio/image/transform',{method:'POST',body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();h.auth.mockResolvedValue({id:'admin'});});
it('requires authentication and validates operations before provider execution',async()=>{
 h.auth.mockResolvedValueOnce({error:Response.json({error:'Unauthorized'},{status:401})});
 expect((await POST(request({}))).status).toBe(401);
 expect((await POST(request({operation:'edit',source:'image'}))).status).toBe(400);
 expect(h.edit).not.toHaveBeenCalled();
});
it('requires durable storage before reporting a transformed image',async()=>{
 h.optimize.mockResolvedValue('data:image/png;base64,aGVsbG8=');
 h.persist.mockResolvedValueOnce({asset:{id:'asset'},publicUrl:'https://assets.example.test/image.png'});
 expect((await POST(request({operation:'optimize',source:'image',optimize:{width:4}}))).status).toBe(201);
 expect(h.persist).toHaveBeenCalledWith(expect.objectContaining({organizationId:'org',buffer:expect.any(Buffer)}));
 h.persist.mockRejectedValueOnce(new Error('save failed'));
 expect((await POST(request({operation:'optimize',source:'image'}))).status).toBe(500);
});
it('does not dispatch a paid request without budget approval',async()=>{
 vi.stubEnv('MEDIA_VISION_MAX_COST_MICROS','5000');
 try{
 h.reserve.mockResolvedValue({decision:'approval_required',requestId:'request'});
 h.execute.mockImplementation(async(input)=>{const authorization=await input.authorize();return{decision:authorization.decision,requestId:authorization.requestId};});
 const response=await POST(request({operation:'describe',source:'image'}));
 expect(response.status).toBe(409);
 expect(h.describe).not.toHaveBeenCalled();
 }finally{vi.unstubAllEnvs();}
});
