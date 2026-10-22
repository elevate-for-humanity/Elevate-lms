export function storageCapError(error) {
 return /(?:download bandwidth|transaction.*cap exceeded|bandwidth.*cap exceeded|storage.*cap exceeded|storage.*quota exceeded|quota exceeded)/i.test(String(error?.message??error));
}
export function createCheckpointFallback({readPrimary,writePrimary,readFallback,writeFallback,onFallback=()=>{}}) {
 let fallback=false;
 async function select(primary,backup,...args){
  if(fallback)return backup(...args);
  try{return await primary(...args);}catch(error){
   if(!storageCapError(error))throw error;
   fallback=true;onFallback(error);
   return backup(...args);
  }
 }
 return {read:key=>select(readPrimary,readFallback,key),write:(key,bytes)=>select(writePrimary,writeFallback,key,bytes),usingFallback:()=>fallback};
}
export function privateCheckpointStorage({request=fetch,env=process.env}={}){
 const base=(env.NEXT_PUBLIC_SUPABASE_URL??'').replace(/\/$/,'');
 const key=env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)throw Error('PRIVATE_CHECKPOINT_STORAGE_AUTH_REQUIRED');
 const headers={apikey:key,Authorization:'Bearer '+key};
 const url=name=>base+'/storage/v1/object/course_videos/'+name.split('/').map(encodeURIComponent).join('/');
 return {
  async read(name){const r=await request(url(name),{headers,signal:AbortSignal.timeout(30000)});if(r.status===404)return null;if(!r.ok){const e=await r.json().catch(()=>({}));if(String(e.statusCode)==='404'&&/not found/i.test(e.message??''))return null;throw Error('PRIVATE_CHECKPOINT_READ_HTTP_'+r.status);}return Buffer.from(await r.arrayBuffer());},
  async write(name,bytes){const r=await request(url(name),{method:'POST',headers:{...headers,'Content-Type':'video/mp4','x-upsert':'true'},body:bytes,signal:AbortSignal.timeout(120000)});if(!r.ok)throw Error('PRIVATE_CHECKPOINT_WRITE_HTTP_'+r.status);const saved=await this.read(name);if(!saved?.equals(bytes))throw Error('PRIVATE_CHECKPOINT_READBACK_MISMATCH');}
 };
}
