import {S3Client,HeadObjectCommand} from '@aws-sdk/client-s3';

export function publishedMediaObject(source,targetBucket,sourceBase){
 if(typeof source!=='string')return null;
 let url;try{url=new URL(source);}catch{return null;}
 if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
 const virtual=url.hostname.match(/^(.+)\.s3\.[a-z0-9-]+\.backblazeb2\.com$/);
 if(virtual?.[1]===targetBucket)return {kind:'backblaze-b2',key:decodeURIComponent(url.pathname.slice(1))};
 if(/^f[0-9]+\.backblazeb2\.com$/.test(url.hostname)&&url.pathname.startsWith('/file/'+targetBucket+'/'))return {kind:'backblaze-b2',key:decodeURIComponent(url.pathname.slice(('/file/'+targetBucket+'/').length))};
 if(/^s3\.[a-z0-9-]+\.backblazeb2\.com$/.test(url.hostname)&&url.pathname.startsWith('/'+targetBucket+'/'))return {kind:'backblaze-b2',key:decodeURIComponent(url.pathname.slice(targetBucket.length+2))};
 if(url.origin===sourceBase){
  const match=url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/(course-videos|course_videos)\/(.+)$/);
  if(match)return {kind:'supabase',key:match[1]+'/'+decodeURIComponent(match[2])};
 }
 return null;
}

/** Inspect metadata and object existence without reading learner records or exposing bearer URLs. */
export async function inspectPublishedB2Media(env,target,{request=fetch,head}={}){
 const base=env.NEXT_PUBLIC_SUPABASE_URL;
 if(base!=='https://cuxzzpsyufcewtmicszk.supabase.co')throw Error('COURSE_MEDIA_APPROVED_SOURCE_REQUIRED');
 const url=new URL('/rest/v1/course_lessons',base);
 url.searchParams.set('select','id,video_url,film_media_url:content_json->film->>mediaUrl,film_video_url:content_json->film->>videoUrl,film_playback_url:content_json->film->>playbackUrl');
 url.searchParams.set('is_published','eq.true');url.searchParams.set('limit','10000');
 const response=await request(url.href,{headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY},redirect:'error',signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('COURSE_MEDIA_REFERENCE_LOOKUP_FAILED');
 const result=await response.json();if(!Array.isArray(result)||result.length>=10000)throw Error('COURSE_MEDIA_REFERENCE_INVENTORY_UNBOUNDED');
 const rows=result.filter(row=>row.film_media_url||row.film_video_url||row.film_playback_url||row.video_url);
 if(!head){
  const client=new S3Client({endpoint:target.ELEVATE_MEDIA_ENDPOINT,region:target.ELEVATE_MEDIA_REGION,credentials:{accessKeyId:target.ELEVATE_MEDIA_ACCESS_KEY_ID,secretAccessKey:target.ELEVATE_MEDIA_SECRET_ACCESS_KEY}});
  head=key=>client.send(new HeadObjectCommand({Bucket:target.ELEVATE_MEDIA_BUCKET,Key:key}),{abortSignal:AbortSignal.timeout(20000)});
 }
 const report={publishedReferences:rows.length,b2References:0,supabaseReferences:0,unknownReferences:0,existingB2Objects:0,supabaseCopiesPresent:0,missingB2Lessons:[],unmigratedSupabaseLessons:[]};
 for(let offset=0;offset<rows.length;offset+=4){
  await Promise.all(rows.slice(offset,offset+4).map(async row=>{
   const source=row.film_media_url||row.film_video_url||row.film_playback_url||row.video_url;
   const object=publishedMediaObject(source,target.ELEVATE_MEDIA_BUCKET,base);
   if(!object){report.unknownReferences++;return;}
   if(!object.key||object.key.split('/').some(part=>!part||part==='.'||part==='..')||object.key.includes('\\'))throw Error('COURSE_MEDIA_OBJECT_KEY_INVALID');
   if(object.kind==='backblaze-b2')report.b2References++;else report.supabaseReferences++;
   let metadata;
   try{metadata=await head(object.key);}catch(error){
    if(error?.$metadata?.httpStatusCode!==404&&error?.name!=='NotFound')throw Error('COURSE_MEDIA_PRIVATE_OBJECT_PROBE_FAILED');
   }
   const exists=Number(metadata?.ContentLength)>0;
   if(object.kind==='backblaze-b2'){
    if(exists)report.existingB2Objects++;else report.missingB2Lessons.push(row.id);
   }else{
    if(exists)report.supabaseCopiesPresent++;else report.unmigratedSupabaseLessons.push(row.id);
   }
  }));
 }
 report.allPublishedVideosInB2=report.supabaseReferences===0&&report.unknownReferences===0&&report.missingB2Lessons.length===0;
 return report;
}
