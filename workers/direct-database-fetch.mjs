import {courseProgressSignal} from '../lib/ultimate-course-builder/worker/progress-watch.mjs';
/** No write replay. Bound both the response and body reads of worker requests. */
export function createDirectDatabaseFetch({request=fetch,timeout=AbortSignal.timeout,progress=courseProgressSignal}={}){
 return async(input,init={})=>{
  const raw=input instanceof Request?input.url:String(input);
  const storage=new URL(raw).pathname.startsWith('/storage/v1/');
  const deadline=timeout(storage?120000:30000),signal=progress();
  try{return await request(input,{...init,signal:AbortSignal.any([deadline,init.signal,signal].filter(Boolean))});}
  catch(error){
   if(signal?.aborted)throw signal.reason;
   if(deadline.aborted)throw new Error(storage?'DIRECT_STORAGE_HTTP_TIMEOUT':'DIRECT_DATABASE_HTTP_TIMEOUT',{cause:error});
   throw error;
  }
 };
}
