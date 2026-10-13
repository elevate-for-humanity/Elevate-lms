import {createHash} from 'node:crypto';
import {createWriteStream} from 'node:fs';
import {mkdtemp as tempDirectory,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pipeline} from 'node:stream/promises';
import {createClient} from '@supabase/supabase-js';
import {ListObjectsV2Command,HeadObjectCommand,GetObjectCommand} from '@aws-sdk/client-s3';
import {getElevateMediaStorageConfig,getElevateMediaStorageClient} from '../../lib/storage/elevate-media-storage';

// Read-only production recovery audit. Never print credentials, signed URLs,
// private storage keys, learner data, or raw provider errors. A candidate URL
// is emitted only for a known lesson identifier and existing public delivery.
async function main(){
  let input='';for await(const part of process.stdin) input+=part;
  const env=JSON.parse(input).runtimeEnvironment;
  if(!env || typeof env!=='object') throw new Error('RUNTIME_CONFIGURATION_REQUIRED');
  for(const [key,value] of Object.entries(env)) if(typeof value==='string' && /^(ELEVATE_MEDIA_|S3_|R2_|CLOUDFLARE_R2_|AWS_|CLOUDFLARE_ACCOUNT_ID$)/.test(key)) process.env[key]=value;
  const config=getElevateMediaStorageConfig();
  const deep=process.env.COURSE_MEDIA_DEEP_AUDIT==='true';
  const report:any={purpose:'course-media-recovery-audit',bucket:'elevate-course-media',mediaAcceptanceVerified:false,failures:[]};
  if(config.bucket!==report.bucket || config.provider!=='backblaze-b2' || !config.endpoint ||
      !/^https:\/\/s3\.[a-z0-9-]+\.backblazeb2\.com\/?$/.test(config.endpoint) || !config.accessKeyId || !config.secretAccessKey){
    report.status='target_connection_unavailable';report.configuredProvider=config.provider;
    console.log(JSON.stringify(report));return;
  }
  const courseIds=['2c723bfa-8c40-4acc-b961-98d917710ffc','9ca9fb50-7119-46ea-ab81-9b0193c29c31'];
  const tokens=[...courseIds,'barber-a','barber-b','barber-c','barber-d','barber-e','barber-f','barber-g','barber-h','barber-i','barber-j','barber-k','barber-l','barber-m','barber-protective-coverings'];
  const referencedKeys=new Set<string>();
  if(env.NEXT_PUBLIC_SUPABASE_URL==='https://cuxzzpsyufcewtmicszk.supabase.co' && env.SUPABASE_SERVICE_ROLE_KEY){
    const db=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error}=await db.from('course_lessons').select('id,video_url,film_video_url:content_json->film->>videoUrl').in('course_id',courseIds);
    if(error) report.failures.push({operation:'canonical_lesson_ids',code:error.code});
    else for(const lesson of data??[]){
      tokens.push(lesson.id);
      for(const value of [lesson.video_url,lesson.film_video_url]){
        try{
          const url=new URL(String(value));
          if(url.protocol!=='https:' || !/(^|\.)backblazeb2\.com$/.test(url.hostname)) continue;
          for(const prefix of [`/file/${config.bucket}/`,`/${config.bucket}/`]) if(url.pathname.startsWith(prefix)) referencedKeys.add(decodeURIComponent(url.pathname.slice(prefix.length)));
          if(url.hostname.startsWith(config.bucket+'.')) referencedKeys.add(decodeURIComponent(url.pathname.slice(1)));
        }catch{/* Non-storage playback references are not object keys. */}
      }
    }
  }else report.failures.push({operation:'canonical_lesson_ids',code:'authorized_database_connection_unavailable'});
  const matches=new RegExp('(^|[/_.-])('+tokens.join('|')+')(?=$|[/_.-])','i');
  const client=getElevateMediaStorageClient();
  const objects:any[]=[];let continuation:string|undefined;let pages=0;
  try{
    do{
      const page=await client.send(new ListObjectsV2Command({Bucket:config.bucket,ContinuationToken:continuation,MaxKeys:1000}));
      objects.push(...(page.Contents??[]).filter(object=>object.Key && (referencedKeys.has(object.Key) || matches.test(object.Key))));
      continuation=page.NextContinuationToken;pages++;
    }while(continuation && pages<10);
    report.listingComplete=!continuation;report.matchingReferences=objects.length;report.objects=[];
    for(const object of objects.slice(0,200)){
      const key=object.Key!;
      const reference:any={keySha256:createHash('sha256').update(key).digest('hex'),bytes:object.Size??0};
      const lessonToken=tokens.find(token=>new RegExp('^(?:course-videos/)?generated-lessons/lesson-'+token+'(?:-[a-z0-9]+)?\\.mp4$','i').test(key));
      if(lessonToken){
        reference.lessonToken=lessonToken;
        try{
          const base=new URL(config.publicUrl);
          if(base.protocol==='https:'&&!base.username&&!base.password&&!base.search&&!base.hash)
            reference.publicDeliveryCandidate=base.href.replace(/\/$/,'')+'/'+key;
        }catch{/* Private objects remain private; never emit a signed URL. */}
      }
      try{
        const head=await client.send(new HeadObjectCommand({Bucket:config.bucket,Key:key}));
        reference.bytes=head.ContentLength??reference.bytes;reference.contentType=head.ContentType;
        if(reference.bytes>0){
          const prefix=await client.send(new GetObjectCommand({Bucket:config.bucket,Key:key,Range:'bytes=0-63'}));
          const bytes=await prefix.Body?.transformToByteArray();
          reference.isoBmffHeaderPresent=Boolean(bytes && Buffer.from(bytes).subarray(4,8).toString('ascii')==='ftyp');
          if(deep && reference.isoBmffHeaderPresent && reference.bytes<=1024*1024*1024){
            const directory=await tempDirectory(join(tmpdir(),'course-recovery-'));
            try{
              const file=join(directory,'candidate.mp4');
              const download=await client.send(new GetObjectCommand({Bucket:config.bucket,Key:key}),{abortSignal:AbortSignal.timeout(120000)});
              if(!download.Body) throw new Error('OBJECT_BODY_REQUIRED');
              await pipeline(download.Body as any,createWriteStream(file));
              const {inspectCourseMedia}=await import('./inspect-course-media.mjs');
              reference.technical=await inspectCourseMedia(file);
            }catch{reference.technicalInspectionStatus='failed';}
            finally{await rm(directory,{recursive:true,force:true});}
          }
        }
      }catch(error:any){reference.readStatus=error?.$metadata?.httpStatusCode??'read_failed';}
      report.objects.push(reference);
    }
    report.uninspectedMatchingReferences=Math.max(0,objects.length-200);
    report.status='inspected';
  }catch(error:any){report.status='listing_failed';report.failures.push({operation:'target_bucket_listing',httpStatus:error?.$metadata?.httpStatusCode??'read_failed'});}
  console.log(JSON.stringify(report,null,2));
}
main().catch(()=>{console.error('COURSE_STORAGE_AUDIT_FAILED');process.exitCode=1;});
