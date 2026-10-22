/**
 * Copy-only, verification-first course media migration.
 * Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and B2 S3 credentials.
 * Never rewrites lesson references or deletes Supabase objects.
 * A later cutover must reconcile *all* database references and private-media access.
 */
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdtemp, open, rm, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {S3Client,PutObjectCommand,GetObjectCommand,HeadObjectCommand} from '@aws-sdk/client-s3';

const BUCKETS=['course-videos','course_videos'];
const safePath=(name)=>name.split('/').every(part=>part&&part!=='.'&&part!=='..')&&!name.includes('\\');
async function digestStream(stream){
 const hash=createHash('sha256');let size=0;
 for await(const chunk of stream){hash.update(chunk);size+=chunk.length;}
 return {sha256:hash.digest('hex'),size};
}
export async function migrate({request=fetch,env=process.env,client,limit=Number(env.MIGRATION_LIMIT||'25'),onResult=console.log}={}){
 const source=requiredFrom(env,'SUPABASE_URL').replace(/\/$/,'');
 const token=requiredFrom(env,'SUPABASE_SERVICE_ROLE_KEY');
 const targetBucket=requiredFrom(env,'ELEVATE_MEDIA_BUCKET');
 const s3=client??new S3Client({
  endpoint:requiredFrom(env,'ELEVATE_MEDIA_ENDPOINT'),
  region:requiredFrom(env,'ELEVATE_MEDIA_REGION'),
  credentials:{accessKeyId:requiredFrom(env,'ELEVATE_MEDIA_ACCESS_KEY_ID'),secretAccessKey:requiredFrom(env,'ELEVATE_MEDIA_SECRET_ACCESS_KEY')}
 });
 if(!Number.isSafeInteger(limit)||limit<1||limit>1000)throw Error('MIGRATION_LIMIT must be 1..1000');
 const auth={apikey:token,Authorization:'Bearer '+token};
 const skip=Number(env.MIGRATION_SKIP||'0');
 if(!Number.isSafeInteger(skip)||skip<0)throw Error('MIGRATION_SKIP must be >=0');
 let visited=0,examined=0,copied=0,verified=0;
 for(const bucket of BUCKETS){
  // The Storage list API returns virtual folders. Descend only after the
  // parent is fully paged; offsets are local to each directory.
  const stack=[''];
  while(stack.length&&examined<limit){
   const prefix=stack.pop();let offset=0;
   while(examined<limit){
    const response=await request(source+'/storage/v1/object/list/'+encodeURIComponent(bucket),{
      method:'POST',headers:{...auth,'Content-Type':'application/json'},
      body:JSON.stringify({prefix,limit:100,offset,sortBy:{column:'name',order:'asc'}}),
      signal:AbortSignal.timeout(30000)
    });
    if(!response.ok)throw Error('SOURCE_LIST_FAILED:'+bucket+':HTTP_'+response.status);
    const items=await response.json();
    if(!Array.isArray(items))throw Error('SOURCE_LIST_INVALID');
    for(const item of items){
     const name=prefix+item.name;
     if(!safePath(name))throw Error('UNSAFE_STORAGE_KEY');
     if(!item.id){stack.push(name+'/');continue;}
     if(visited++<skip)continue;
     if(examined>=limit)break;
     examined++;
     const key=bucket+'/'+name;
     const resource=source+'/storage/v1/object/authenticated/'+encodeURIComponent(bucket)+'/'+name.split('/').map(encodeURIComponent).join('/');
     const temp=await mkdtemp(join(tmpdir(),'course-media-migrate-'));const file=join(temp,'object');
     try{
      const res=await request(resource,{headers:auth,signal:AbortSignal.timeout(120000)});
      if(!res.ok||!res.body)throw Error('SOURCE_READ_FAILED:HTTP_'+res.status);
      const handle=await open(file,'w');
      try{await pipeline(Readable.fromWeb(res.body),handle.createWriteStream());}finally{await handle.close().catch(()=>{});}
      const sourceStats=await stat(file);
      const local=await digestStream(createReadStream(file));
      if(!sourceStats.size||local.size!==sourceStats.size)throw Error('SOURCE_SIZE_MISMATCH');
      const head=await s3.send(new HeadObjectCommand({Bucket:targetBucket,Key:key})).catch(e=>{
       if(e?.$metadata?.httpStatusCode===404||e?.name==='NotFound')return null;throw e;
      });
      if(!(head?.Metadata?.sha256===local.sha256&&Number(head.ContentLength)===local.size)){
       await s3.send(new PutObjectCommand({Bucket:targetBucket,Key:key,Body:createReadStream(file),
         ContentLength:local.size,Metadata:{sha256:local.sha256},
         ContentType:item.metadata?.mimetype||'application/octet-stream'}));
       copied++;
      }
      const remote=await s3.send(new GetObjectCommand({Bucket:targetBucket,Key:key}));
      if(!remote.Body)throw Error('DESTINATION_READ_EMPTY');
      const compared=await digestStream(remote.Body);
      if(compared.sha256!==local.sha256||compared.size!==local.size)throw Error('DESTINATION_CHECKSUM_MISMATCH');
      verified++;onResult(JSON.stringify({sourceBucket:bucket,key,bytes:local.size,sha256:local.sha256,verified:true}));
     }finally{await rm(temp,{recursive:true,force:true});}
    }
    if(items.length<100)break;
    offset+=items.length;
   }
  }
 }
 return {skip,examined,copied,verified,nextSkip:skip+examined,complete:false,deleted:0};
}
function requiredFrom(env,key){const v=env[key]?.trim();if(!v)throw Error('MISSING_'+key);return v;}
if(import.meta.url==='file://'+process.argv[1]){
 migrate().then(summary=>console.log(JSON.stringify({summary}))).catch(error=>{console.error(error.message);process.exitCode=1;});
}
