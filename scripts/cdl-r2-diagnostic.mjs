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
const config=Object.fromEntries(required.map(k=>[k,v[k]]));
const groups=await nf('/secrets');
for(const [name,ids] of [
 ['elevate-media-runtime-secrets',['elevate-admin','elevate-lms']],
 ['elevate-media-worker-secrets',['elevate-ultimate-worker','elevate-studio-browser']]
]){
 const exists=groups.secrets?.some(x=>x.id===name);
 const body={type:'secret',secretType:'environment',priority:30,restrictions:{restricted:true,nfObjects:ids.map(id=>({id,type:'service'})),tags:[]},secrets:{variables:config}};
 await nf(exists?'/secrets/'+name:'/secrets',exists?'PATCH':'POST',exists?body:{name,...body});
 console.info(JSON.stringify({runtimeGroup:name,services:ids,saved:true}));
}
const retained={...v};delete retained.ELEVATE_MEDIA_ACCESS_KEY_ID;delete retained.ELEVATE_MEDIA_SECRET_ACCESS_KEY;
await nf('/secrets/elevate-production-env','PATCH',{secrets:{...g.secrets,variables:retained}});
const readback=await nf('/secrets/elevate-production-env/details');
console.info(JSON.stringify({sharedCredentialsRemoved:!readback.secrets.variables.ELEVATE_MEDIA_SECRET_ACCESS_KEY,sharedGroupScope:g.secretType}));
for(const id of ['elevate-admin','elevate-lms','elevate-ultimate-worker','elevate-studio-browser']){
 const env=await nf('/services/'+id+'/runtime-environment/details');
 const actual=env.runtimeEnvironment??{};
 const matches=required.every(k=>(actual[k]?.value??actual[k])===v[k]);
 console.info(JSON.stringify({service:id,mediaConfigInherited:matches}));
 if(!matches)throw new Error('Media configuration not inherited by '+id);
 await nf('/services/'+id+'/restart','POST',{});
 console.info(JSON.stringify({service:id,restartAccepted:true}));
}

for(const id of ['elevate-admin','elevate-lms','elevate-ultimate-worker','elevate-studio-browser']){
 const service=await nf('/services/'+id);console.info(JSON.stringify({service:id,status:service.status}));
}
