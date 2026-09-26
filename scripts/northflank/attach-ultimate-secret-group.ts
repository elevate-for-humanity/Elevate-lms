#!/usr/bin/env tsx
import {nfFetch,projectApiPath,resolveProjectId} from './lib';
const SERVICE_ID=process.env.NORTHFLANK_ULTIMATE_WORKER_SERVICE_ID||'elevate-ultimate-worker';
const SECRET_ID=process.env.NORTHFLANK_SECRET_GROUP_ID||'elevate-production-env';
async function main(){const projectId=resolveProjectId();if(!projectId)throw new Error('NORTHFLANK_PROJECT_ID_REQUIRED');const current:any=await nfFetch(projectApiPath(projectId,`/secrets/${SECRET_ID}`));const restrictions=current.restrictions??{};const objects=restrictions.nfObjects??[];if(objects.some((x:any)=>x.type==='service'&&x.id===SERVICE_ID)){console.log(`${SECRET_ID} already grants ${SERVICE_ID} access`);return;}await nfFetch(projectApiPath(projectId,`/secrets/${SECRET_ID}`),{method:'PATCH',body:JSON.stringify({restrictions:{restricted:true,nfObjects:[...objects,{id:SERVICE_ID,type:'service'}],tags:restrictions.tags??[],tagMatchCondition:restrictions.tagMatchCondition??'or'}})});console.log(`Attached ${SECRET_ID} to ${SERVICE_ID} without reading or copying secret values`);}
main().catch(e=>{console.error(e);process.exit(1)});
