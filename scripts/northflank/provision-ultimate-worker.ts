#!/usr/bin/env tsx
import {combinedServiceCreatePath,combinedServicePatchPath,nfFetch,projectApiPath,resolveProjectId} from './lib.ts';
const projectId=resolveProjectId();if(!projectId)throw new Error('NORTHFLANK_PROJECT_ID_REQUIRED');
const serviceId=process.env.NORTHFLANK_ULTIMATE_WORKER_SERVICE_ID||'elevate-ultimate-worker';
const branch=process.env.NORTHFLANK_GIT_BRANCH||'main';
const serviceRole=process.env.SUPABASE_SERVICE_ROLE_KEY;const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://cuxzzpsyufcewtmicszk.supabase.co';
if(!serviceRole)throw new Error('SUPABASE_SERVICE_ROLE_KEY_REQUIRED');
const cloudflareAccountId=process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const cloudflareToken=(process.env.CLOUDFLARE_AI_API_TOKEN||process.env.CLOUDFLARE_API_TOKEN)?.trim();
if(!cloudflareAccountId||!cloudflareToken)throw new Error('ULTIMATE_CLOUDFLARE_NARRATION_CONFIG_REQUIRED');
const payload={name:serviceId,description:'Ultimate Course Builder durable production worker',billing:{deploymentPlan:'nf-compute-400'},deployment:{instances:1,docker:{configType:'default'},strategy:{type:'recreate'},storage:{shmSize:64,ephemeralStorage:{storageSize:2048}}},buildSource:'git',vcsData:{projectUrl:'https://github.com/elevate-for-humanity/Elevate-lms',projectType:'github',projectBranch:branch},buildSettings:{storage:{ephemeralStorage:{storageSize:16384}},dockerfile:{buildEngine:'buildkit',dockerFilePath:'/Dockerfile.ultimate-worker',dockerWorkDir:'/',buildkit:{useCache:true,cacheStorageSize:10240}}},runtimeEnvironment:{NODE_ENV:'production',NEXT_PUBLIC_SUPABASE_URL:supabaseUrl,SUPABASE_SERVICE_ROLE_KEY:serviceRole,ULTIMATE_WORKER_ID:'northflank-ultimate-worker',ULTIMATE_WORKER_POLL_MS:'5000',AI_PROVIDER:'none',AI_NARRATION_PROVIDER:'cloudflare',CLOUDFLARE_ACCOUNT_ID:cloudflareAccountId,CLOUDFLARE_AI_API_TOKEN:cloudflareToken,...Object.fromEntries(['ONET_API_KEY','USAJOBS_API_KEY','USAJOBS_USER_AGENT_EMAIL','CAREERONESTOP_USER_ID','CAREERONESTOP_API_KEY'].filter(key=>process.env[key]?.trim()).map(key=>[key,process.env[key]!.trim()]))}};
async function exists(){try{await nfFetch(projectApiPath(projectId!,`/services/${serviceId}`));return true}catch{return false}}
if(!process.argv.includes('--execute')){console.log(JSON.stringify({serviceId,branch,projectId},null,2));process.exit(0)}
if(await exists()){
  const current=await nfFetch<{runtimeEnvironment?:Record<string,string>}>(projectApiPath(projectId,`/services/${serviceId}`));
  const learnerEnvironment=Object.fromEntries(['ULTIMATE_LEARNER_RUNTHROUGH_URL','ULTIMATE_LEARNER_RUNTHROUGH_SECRET'].filter(key=>current.runtimeEnvironment?.[key]).map(key=>[key,current.runtimeEnvironment![key]]));
  await nfFetch(combinedServicePatchPath(projectId,serviceId),{method:'PATCH',body:JSON.stringify({...payload,runtimeEnvironment:{...payload.runtimeEnvironment,...learnerEnvironment}})});
}else await nfFetch(combinedServiceCreatePath(projectId),{method:'POST',body:JSON.stringify(payload)});
console.log(`Ultimate worker service saved: ${serviceId} from ${branch}`);
