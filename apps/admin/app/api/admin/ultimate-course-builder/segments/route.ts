import {NextRequest,NextResponse} from 'next/server';
import {apiRequireAdmin} from '@/lib/admin/guards';
import {requireAdminClient} from '@/lib/supabase/admin';
import {GetObjectCommand,ListObjectsV2Command} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {getElevateMediaStorageClient,getElevateMediaStorageConfig,isElevateMediaStorageConfigured} from '@/lib/storage/elevate-media-storage';
import {contiguousRenderSegments} from '@/lib/ultimate-course-builder/media/progressive-segments.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'};
export async function GET(req:NextRequest){
 const auth=await apiRequireAdmin(req);if(auth.error)return auth.error;
 const buildId=req.nextUrl.searchParams.get('buildId'),lessonBuildId=req.nextUrl.searchParams.get('lessonBuildId');
 if(![buildId,lessonBuildId].every(v=>/^[a-f0-9-]{36}$/i.test(v??'')))return NextResponse.json({error:'Select a saved lesson.'},{status:400,headers});
 try{
  const db=await requireAdminClient();
  const {data:build,error:be}=await db.from('ultimate_course_builds').select('profile').eq('id',buildId).maybeSingle();if(be)throw be;
  const {data:lesson,error:le}=await db.from('ultimate_lesson_builds').select('competency_id,status').eq('id',lessonBuildId).eq('build_id',buildId).maybeSingle();if(le)throw le;
  if(!build||!lesson)return NextResponse.json({error:'Lesson not found'},{status:404,headers});
  const {data:step,error:se}=await db.from('ultimate_lesson_steps').select('state,started_at').eq('lesson_build_id',lessonBuildId).eq('step','lesson_film_render').maybeSingle();if(se)throw se;
  const lessonId=build.profile?.canonicalLessonIds?.[lesson.competency_id];
  if(!/^[a-f0-9-]{36}$/i.test(lessonId??'')||step?.state!=='running'||!step.started_at)return NextResponse.json({segments:[],inProgress:false},{headers});
  const prefix=`course-render-checkpoints/${lessonId}/`;
  const objects:any[]=[];let available=false;
  // The renderer uses private Supabase checkpoints when B2 reaches its account cap.
  const {data:folders,error:fe}=await db.storage.from('course_videos').list(prefix.slice(0,-1),{limit:32});
  if(!fe){available=true;await Promise.all((folders??[]).filter(f=>/^[a-f0-9]{24}$/.test(f.name)).map(async folder=>{
   const {data:files,error}=await db.storage.from('course_videos').list(prefix+folder.name,{limit:1000});if(error)return;
   for(const file of files??[])objects.push({key:prefix+folder.name+'/'+file.name,updatedAt:file.updated_at,bytes:Number(file.metadata?.size),store:'private'});
  }));}
  let client:ReturnType<typeof getElevateMediaStorageClient>|undefined;let bucket='';
  if(isElevateMediaStorageConfigured())try{
   client=getElevateMediaStorageClient();bucket=getElevateMediaStorageConfig().bucket;
   const response=await client.send(new ListObjectsV2Command({Bucket:bucket,Prefix:prefix,MaxKeys:1000}),{abortSignal:AbortSignal.timeout(5000)});available=true;
   for(const file of response.Contents??[])objects.push({key:file.Key,updatedAt:file.LastModified?.toISOString(),bytes:file.Size,store:'b2'});
  }catch{/* Existing private checkpoints remain playable during B2 account caps. */}
  if(!available)throw Error('CHECKPOINT_STORAGE_UNAVAILABLE');
  const selected=contiguousRenderSegments(objects,{lessonId,startedAt:step.started_at});
  const segments=await Promise.all(selected.map(async(segment:any)=>{
   let src:string;
   if(segment.store==='private'){
    const {data,error}=await db.storage.from('course_videos').createSignedUrl(segment.key,1800);if(error||!data?.signedUrl)throw Error('CHECKPOINT_SIGNING_FAILED');src=data.signedUrl;
   }else{if(!client)throw Error('CHECKPOINT_STORAGE_UNAVAILABLE');src=await getSignedUrl(client,new GetObjectCommand({Bucket:bucket,Key:segment.key}),{expiresIn:1800});}
   return {id:segment.fingerprint+':'+segment.start,startSeconds:segment.start/30,durationSeconds:(segment.end-segment.start+1)/30,src};
  }));
  return NextResponse.json({segments,inProgress:true,mediaApproved:false},{headers});
 }catch{return NextResponse.json({error:'In-progress video could not be loaded. Retrying preserves the render.'},{status:503,headers});}
}
