#!/usr/bin/env tsx
import {combinedServiceCreatePath,combinedServicePatchPath,nfFetch,projectApiPath,resolveProjectId} from './lib.ts';
const projectId=resolveProjectId();if(!projectId)throw new Error('NORTHFLANK_PROJECT_ID_REQUIRED');
const serviceId=process.env.NORTHFLANK_ULTIMATE_WORKER_SERVICE_ID||'elevate-ultimate-worker';
const branch=process.env.NORTHFLANK_GIT_BRANCH||'ultimate-course-builder-production';
const serviceRole=process.env.SUPABASE_SERVICE_ROLE_KEY;const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://cuxzzpsyufcewtmicszk.supabase.co';
if(!serviceRole)throw new Error('SUPABASE_SERVICE_ROLE_KEY_REQUIRED');const llmUrl=process.env.ELEVATE_LLM_URL;const llmSecret=process.env.ELEVATE_LLM_SECRET;if(!llmUrl||!llmSecret)throw new Error('ULTIMATE_LLM_CONFIG_REQUIRED');
const payload={name:serviceId,description:'Ultimate Course Builder durable production worker',billing:{deploymentPlan:'nf-compute-200'},deployment:{instances:1,docker:{configType:'default'},strategy:{type:'recreate'},storage:{ephemeralStorage:{storageSize:2048}}},buildSource:'git',vcsData:{projectUrl:'https://github.com/elevate-for-humanity/Elevate-lms',projectType:'github',projectBranch:branch},buildSettings:{dockerfile:{buildEngine:'buildkit',dockerFilePath:'/Dockerfile.ultimate-worker',dockerWorkDir:'/',buildkit:{useCache:true,cacheStorageSize:4096}}},runtimeEnvironment:{NODE_ENV:'production',NEXT_PUBLIC_SUPABASE_URL:supabaseUrl,SUPABASE_SERVICE_ROLE_KEY:serviceRole,ULTIMATE_WORKER_ID:'northflank-ultimate-worker',ULTIMATE_WORKER_POLL_MS:'5000',ELEVATE_LLM_URL:llmUrl,ELEVATE_LLM_SECRET:llmSecret}};
async function exists(){try{await nfFetch(projectApiPath(projectId!,`/services/${serviceId}`));return true}catch{return false}}
if(!process.argv.includes('--execute')){console.log(JSON.stringify({serviceId,branch,projectId},null,2));process.exit(0)}
if(await exists())await nfFetch(combinedServicePatchPath(projectId,serviceId),{method:'PATCH',body:JSON.stringify(payload)});else await nfFetch(combinedServiceCreatePath(projectId),{method:'POST',body:JSON.stringify(payload)});
console.log(`Ultimate worker service saved: ${serviceId} from ${branch}`);
