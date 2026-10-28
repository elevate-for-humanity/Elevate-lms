import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {resolveOwnerPreviewB2} from './resolve-owner-preview-b2.mjs';
import {migrate} from './migrate-course-media-to-b2.mjs';

const PROJECT='elegant-racer-299721';
const SELECTED=/^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|ELEVATE_MEDIA_[A-Z_]+|S3_[A-Z_]+)$/;
export function runtimeCourseMediaEnvironment(job,{secret=()=>{throw Error('COURSE_MEDIA_SECRET_REFERENCE_UNAVAILABLE');}}={}){
 if(job?.metadata?.name!=='elevate-course-builder')throw Error('COURSE_MEDIA_UNEXPECTED_RUNTIME');
 const containers=job.spec?.template?.spec?.template?.spec?.containers;
 if(containers?.length!==1)throw Error('COURSE_MEDIA_RUNTIME_CONTAINER_REQUIRED');
 const env={};
 for(const item of containers[0].env??[]){
  if(!SELECTED.test(item.name))continue;
  if(typeof item.value==='string')env[item.name]=item.value;
  else if(item.valueFrom?.secretKeyRef){
   const ref=item.valueFrom.secretKeyRef;
   if(!/^[A-Za-z0-9_-]+$/.test(ref.name??'')||!/^(latest|[0-9]+)$/.test(ref.key??''))throw Error('COURSE_MEDIA_SECRET_REFERENCE_INVALID');
   env[item.name]=secret(ref.name,ref.key);
  }else throw Error('COURSE_MEDIA_RUNTIME_VALUE_UNAVAILABLE');
 }
 if(env.NEXT_PUBLIC_SUPABASE_URL!=='https://cuxzzpsyufcewtmicszk.supabase.co'||!env.SUPABASE_SERVICE_ROLE_KEY)throw Error('COURSE_MEDIA_SOURCE_CONFIGURATION_UNAVAILABLE');
 return env;
}
export async function runRuntimeB2Transfer(job,{mode='audit',limit=1,skip=0,resolve=resolveOwnerPreviewB2,copy=migrate,secret,report=console.log}={}){
 if(!['audit','copy'].includes(mode)||!Number.isInteger(limit)||limit<1||limit>25||!Number.isSafeInteger(skip)||skip<0)throw Error('COURSE_MEDIA_TRANSFER_INPUT_INVALID');
 const env=runtimeCourseMediaEnvironment(job,{secret});
 const connection=await resolve(env);
 const target=connection.environment;
 if(target.ELEVATE_MEDIA_PROVIDER!=='backblaze-b2'||target.ELEVATE_MEDIA_BUCKET!=='elevate-course-media')throw Error('COURSE_MEDIA_APPROVED_B2_TARGET_REQUIRED');
 const summary={provider:'backblaze-b2',bucket:'elevate-course-media',bucketType:connection.bucketType,private:connection.bucketType==='allPrivate',connectionSource:connection.connectionSource,mode};
 report(JSON.stringify(summary));
 if(mode==='audit')return summary;
 if(!summary.private)throw Error('COURSE_MEDIA_PRIVATE_B2_BUCKET_REQUIRED');
 const result=await copy({env:{...target,SUPABASE_URL:env.NEXT_PUBLIC_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY:env.SUPABASE_SERVICE_ROLE_KEY,MIGRATION_SKIP:String(skip)},limit,
  onResult:line=>{const result=JSON.parse(line);const {key,...safe}=result;report(JSON.stringify(safe));}});
 report(JSON.stringify({summary:result}));
 return {...summary,...result};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 let input='';for await(const chunk of process.stdin)input+=chunk;
 try{
  await runRuntimeB2Transfer(JSON.parse(input),{mode:process.env.COURSE_MEDIA_TRANSFER_MODE||'audit',limit:Number(process.env.MIGRATION_LIMIT||'1'),skip:Number(process.env.MIGRATION_SKIP||'0'),
   secret:(name,version)=>execFileSync('gcloud',['secrets','versions','access',version,'--secret='+name,'--project='+PROJECT],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()});
 }catch(error){
  const code=/^[A-Z][A-Z0-9_:.-]{0,160}$/.test(error?.message??'')?error.message:'COURSE_MEDIA_TRANSFER_FAILED';
  console.error(code);process.exitCode=1;
 }
}
