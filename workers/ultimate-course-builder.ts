import { randomUUID } from 'node:crypto';
import { runWorkerLoop } from './worker-loop.mjs';
import {createClient} from '@supabase/supabase-js';
import {processUltimateJob} from '../lib/ultimate-course-builder/worker/process-job';
console.log('[UltimateWorker] modules resolved');

const url=process.env.NEXT_PUBLIC_SUPABASE_URL??process.env.SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log('[UltimateWorker] boot',{supabaseUrlPresent:Boolean(url),serviceRolePresent:Boolean(key),nodeEnv:process.env.NODE_ENV??null});
if(!url||!key)throw new Error('ULTIMATE_WORKER_SUPABASE_CONFIG_REQUIRED');

const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const workerId=`${process.env.ULTIMATE_WORKER_ID ?? 'ultimate'}-${randomUUID()}`;
const pollMs=Math.max(1000,Number(process.env.ULTIMATE_WORKER_POLL_MS??5000));
let stopping=false;
for(const signal of ['SIGTERM','SIGINT'] as const)process.on(signal,()=>{stopping=true;});

async function main(){
  const once=process.env.ULTIMATE_WORKER_ONCE==='true';
  console.log('[UltimateWorker] polling loop started',{workerId,pollMs,once});
  await runWorkerLoop({
    once,
    isStopping:()=>stopping,
    delay:()=>new Promise(resolve=>setTimeout(resolve,pollMs)),
    processJob:async()=>{
      try{return await processUltimateJob(db,workerId);}
      catch(error){console.error('[UltimateWorker] poll error',error);throw error;}
    },
    onResult:result=>{if(result.claimed||once)console.log('[UltimateWorker] processed',result);},
  });
}
main().catch(error=>{console.error('[UltimateWorker] fatal',error);process.exit(1);});
