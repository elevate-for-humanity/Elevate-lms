const token=process.env.NORTHFLANK_API_TOKEN;
const pending=new Set(['elevate-admin','elevate-lms','elevate-ultimate-worker','elevate-studio-browser']);
for(let n=0;n<24&&pending.size;n++){
 for(const id of [...pending]){
 const r=await fetch('https://api.northflank.com/v1/projects/elevate-platform/services/'+id,{headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw new Error('Northflank status HTTP '+r.status);
 const raw=await r.json();const s=raw.data??raw;const deployment=s.status?.deployment;
 console.info(JSON.stringify({service:id,deployment}));
 if(deployment?.status==='SUCCESS')pending.delete(id);
 if(deployment?.status==='FAILED'||deployment?.status==='FAILURE')throw new Error('Deployment failed: '+id);
 }
 if(pending.size)await new Promise(r=>setTimeout(r,15000));
}
if(pending.size)throw new Error('Services not ready: '+[...pending].join(','));
console.info('ALL_MEDIA_SERVICES_READY');
