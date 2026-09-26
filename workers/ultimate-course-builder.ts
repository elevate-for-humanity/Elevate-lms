import {createClient} from '@supabase/supabase-js';
import {processUltimateJob} from '../lib/ultimate-course-builder/worker/process-job';

const url=process.env.NEXT_PUBLIC_SUPABASE_URL??process.env.SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error('ULTIMATE_WORKER_SUPABASE_CONFIG_REQUIRED');

const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const workerId=process.env.ULTIMATE_WORKER_ID??`ultimate-${process.pid}`;
const pollMs=Math.max(1000,Number(process.env.ULTIMATE_WORKER_POLL_MS??5000));
let stopping=false;
for(const signal of ['SIGTERM','SIGINT'] as const)process.on(signal,()=>{stopping=true;});

async function main(){
  while(!stopping){
    const result=await processUltimateJob(db,workerId);
    if(result.claimed)console.log('[UltimateWorker] processed',result);
    else await new Promise(resolve=>setTimeout(resolve,pollMs));
  }
}
main().catch(error=>{console.error('[UltimateWorker] fatal',error);process.exit(1);});
