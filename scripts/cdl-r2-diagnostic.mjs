const token=process.env.NORTHFLANK_API_TOKEN;
for(const id of ['elevate-admin','elevate-lms','elevate-ultimate-worker','elevate-studio-browser']){
 const r=await fetch('https://api.northflank.com/v1/projects/elevate-platform/services/'+id,{headers:{authorization:'Bearer '+token}});
 if(!r.ok)throw new Error('Status HTTP '+r.status);const raw=await r.json();const s=raw.data??raw;
 console.info(JSON.stringify({service:id,status:s.status}));
}
