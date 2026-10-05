const token=process.env.NORTHFLANK_API_TOKEN;
if(!token)throw new Error('Northflank credential unavailable');
const candidates=[];
async function nf(project,path){
 const r=await fetch('https://api.northflank.com/v1/projects/'+project+path,{headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
 if(!r.ok){console.info(JSON.stringify({project,path,status:r.status}));return {};}
 const j=await r.json();return j.data??j;
}
function inspect(source,env){
 const found=Object.fromEntries(Object.entries(env??{}).filter(([k,v])=>/B2|BACKBLAZE|S3|ELEVATE_MEDIA|MEDIA_STORAGE/.test(k)&&typeof v==='string'));
 console.info(JSON.stringify({source,configuredKeys:Object.keys(found)}));candidates.push(found);
}
for(const project of ['elevate-platform','elevate-media-gpu']){
 const groups=await nf(project,'/secrets');
 for(const group of groups.secrets??[]){
  if(!/production|media|b2|backblaze|storage|gpu|worker/.test(group.id))continue;
  const d=await nf(project,'/secrets/'+group.id+'/details');inspect(project+'/'+group.id,d.secrets?.variables);
 }
}
for(const id of ['elevate-admin','elevate-lms','elevate-ultimate-worker']){
 const d=await nf('elevate-platform','/services/'+id);inspect(id,d.runtimeEnvironment);
}
const env=Object.assign({},...candidates);
const keyId=env.ELEVATE_MEDIA_ACCESS_KEY_ID||env.B2_APPLICATION_KEY_ID||env.B2_KEY_ID||env.BACKBLAZE_KEY_ID||env.S3_ACCESS_KEY_ID;
const secret=env.ELEVATE_MEDIA_SECRET_ACCESS_KEY||env.B2_APPLICATION_KEY||env.BACKBLAZE_APPLICATION_KEY||env.B2_SECRET_ACCESS_KEY||env.S3_SECRET_ACCESS_KEY;
console.info(JSON.stringify({matchingKeyId:keyId==='0055076046dd6520000000001',secretPresent:!!secret}));
if(!secret){console.info('B2_SECRET_NOT_CONFIGURED');process.exit(0);}
if(keyId!=='0055076046dd6520000000001'){console.info('B2_KEY_ID_NOT_MATCHED');process.exit(0);}
const r=await fetch('https://api.backblazeb2.com/b2api/v4/b2_authorize_account',{headers:{authorization:'Basic '+Buffer.from(keyId+':'+secret).toString('base64')},signal:AbortSignal.timeout(30000)});
const j=await r.json();console.info(JSON.stringify({backblazeAuthStatus:r.status,code:j.code,authorized:r.ok}));
