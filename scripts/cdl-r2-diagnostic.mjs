import {createRequire} from 'node:module';
const require=createRequire('/tmp/b2-verify/package.json');
const {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand,ListObjectsV2Command}=require('@aws-sdk/client-s3');
const {getSignedUrl}=require('@aws-sdk/s3-request-presigner');
const token=process.env.NORTHFLANK_API_TOKEN;
const base='https://api.northflank.com/v1/projects/elevate-platform';
async function nf(path,method='GET',body){
 const r=await fetch(base+path,{method,headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw new Error('Northflank '+method+' '+path+' HTTP '+r.status);
 const txt=await r.text();if(!txt)return {};const j=JSON.parse(txt);return j.data??j;
}
const g=await nf('/secrets/elevate-production-env/details');const v=g.secrets.variables;
const required=['ELEVATE_MEDIA_PROVIDER','ELEVATE_MEDIA_ENDPOINT','ELEVATE_MEDIA_REGION','ELEVATE_MEDIA_BUCKET','ELEVATE_MEDIA_ACCESS_KEY_ID','ELEVATE_MEDIA_SECRET_ACCESS_KEY'];
if(required.some(k=>!v[k]))throw new Error('Missing media configuration');
const client=new S3Client({endpoint:v.ELEVATE_MEDIA_ENDPOINT,region:v.ELEVATE_MEDIA_REGION,credentials:{accessKeyId:v.ELEVATE_MEDIA_ACCESS_KEY_ID,secretAccessKey:v.ELEVATE_MEDIA_SECRET_ACCESS_KEY}});
const Bucket=v.ELEVATE_MEDIA_BUCKET;const Key='_connection-check/'+process.env.GITHUB_RUN_ID+'.txt';const body='Elevate B2 connection verification';
try{
 await client.send(new PutObjectCommand({Bucket,Key,Body:body,ContentType:'text/plain'}));
 const listed=await client.send(new ListObjectsV2Command({Bucket,Prefix:Key}));if(!listed.Contents?.some(o=>o.Key===Key))throw new Error('List verification failed');
 const signed=await getSignedUrl(client,new GetObjectCommand({Bucket,Key}),{expiresIn:120});
 const r=await fetch(signed,{headers:{Range:'bytes=0-6'}});if(r.status!==206||await r.text()!=='Elevate')throw new Error('Signed range download failed');
 const unsigned=new URL(signed);unsigned.search='';const privateResponse=await fetch(unsigned);if(privateResponse.ok)throw new Error('Bucket unexpectedly public');
 console.info(JSON.stringify({bucket:Bucket,upload:true,list:true,signedDownload:true,byteRange:true,privateAccess:true}));
}finally{await client.send(new DeleteObjectCommand({Bucket,Key}));}
for(const id of ['elevate-admin','elevate-lms','elevate-ultimate-worker','elevate-studio-browser']){
 const env=await nf('/services/'+id+'/runtime-environment/details');
 const actual=env.runtimeEnvironment??{};
 const matches=required.every(k=>(actual[k]?.value??actual[k])===v[k]);
 console.info(JSON.stringify({service:id,mediaConfigInherited:matches}));
 if(!matches)throw new Error('Media configuration not inherited by '+id);
 await nf('/services/'+id+'/restart','POST',{});
 console.info(JSON.stringify({service:id,restartAccepted:true}));
}
