import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {apiRequireAdmin} from '@/lib/admin/guards';
import {resolveAdminOrganization} from '@/lib/admin/resolve-admin-organization';
import {applyRateLimit} from '@/lib/api/withRateLimit';
import {safeInternalError} from '@/lib/api/safe-error';
import {requireAdminClient} from '@/lib/supabase/admin';
import {hydrateProcessEnv} from '@/lib/secrets';
import {editImageBytes,optimizeImageBytes,describeImageBytes} from '@/lib/media/image-operations';
import {persistStudioAsset} from '@/lib/media/studio-assets';
import {reservePaidInference,executePaidInference,paidArtifactFingerprint} from '@/lib/ai/paid-inference-gateway';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=180;
const schema=z.object({
  operation:z.enum(['edit','optimize','describe']),source:z.string().min(1).max(28_000_000),
  title:z.string().trim().min(1).max(180).default('Edited image'),
  projectName:z.string().trim().min(1).max(120).default('Media Studio'),
  edit:z.object({action:z.enum(['crop','upscale','filter','remove_background','replace_background','change_color','add_text','add_watermark','add_overlay','style_transfer']),
    scale:z.union([z.literal(2),z.literal(4)]).optional(),cropArea:z.object({x:z.number().int().min(0),y:z.number().int().min(0),width:z.number().int().positive(),height:z.number().int().positive()}).optional(),
    text:z.string().max(1000).optional(),backgroundPrompt:z.string().max(2000).optional(),targetColor:z.string().max(100).optional(),sourceColor:z.string().max(100).optional(),parameters:z.record(z.string(),z.unknown()).optional(),
  }).optional(),
  optimize:z.object({width:z.number().int().min(1).max(8192).optional(),height:z.number().int().min(1).max(8192).optional(),quality:z.number().int().min(1).max(100).optional(),format:z.enum(['webp','jpeg','png']).default('webp')}).optional(),
});
export async function POST(request:NextRequest){
  const limited=await applyRateLimit(request,'api');if(limited)return limited;
  const auth=await apiRequireAdmin(request);if(auth.error)return auth.error;
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({ok:false,error:'Invalid image operation.'},{status:400});
  const input=parsed.data;
  if(input.operation==='edit'&&!input.edit)return NextResponse.json({ok:false,error:'An edit request is required.'},{status:400});
  try{
    await hydrateProcessEnv();
    const actor=await resolveAdminOrganization(auth);
    const db=await requireAdminClient();
    const paid=input.operation==='describe'||(input.operation==='edit'&&!['crop','upscale','filter'].includes(input.edit!.action));
    const run=async()=>input.operation==='describe'?describeImageBytes(input.source):input.operation==='optimize'?optimizeImageBytes(input.source,input.optimize):editImageBytes(input.source,input.edit!);
    let output:string;
    if(paid){
      // The cap is an operator-configured budget, not an invented provider price.
      const cap=Number(process.env[input.operation==='describe'?'MEDIA_VISION_MAX_COST_MICROS':'MEDIA_EDIT_MAX_COST_MICROS']);
      if(!Number.isSafeInteger(cap)||cap<1)return NextResponse.json({ok:false,error:'Configure the media operation spending cap before paid execution.'},{status:503});
      const fingerprint=paidArtifactFingerprint({organizationId:actor.organizationId,...input});
      const authorization=await reservePaidInference(db,{scopeKey:`media:${actor.organizationId}`,actorId:actor.userId,artifactFingerprint:fingerprint,idempotencyKey:request.headers.get('idempotency-key')||fingerprint,provider:'openai',model:input.operation==='describe'?(process.env.OPENAI_VISION_MODEL||'gpt-4.1-mini'):(process.env.OPENAI_IMAGE_EDIT_MODEL||'gpt-image-1.5'),operation:input.operation,projectedCostMicros:cap});
      const result=await executePaidInference({db,authorize:async()=>authorization,dispatch:run});
      if(result.decision!=='approved'||typeof result.value!=='string')return NextResponse.json({ok:false,decision:result.decision,requestId:result.requestId,error:'Paid operation has not been authorized.'},{status:409});
      output=result.value;
    }else output=await run();
    if(input.operation==='describe')return NextResponse.json({ok:true,altText:output});
    const image=output.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
    if(!image)throw new Error('Image operation did not return image bytes.');
    const saved=await persistStudioAsset({organizationId:actor.organizationId,userId:actor.userId,projectName:input.projectName,fileName:`${input.title}.${image[1]}`,buffer:Buffer.from(image[2],'base64'),contentType:`image/${image[1]}`,type:'image',title:input.title,metadata:{kind:'image-transform',operation:input.operation}});
    return NextResponse.json({ok:true,...saved},{status:201});
  }catch(error){return safeInternalError(error,'Image operation failed');}
}
