#!/usr/bin/env node
/**
 * Read-only binding and rotation preflight. Never writes a secret version,
 * deploys a revision, modifies IAM, or changes Cloud Run traffic.
 * Explicit production release with health verification is a separate operation.
 */
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {planTokenBootstrap} from './bootstrap-internal-token.mjs';
const services={admin:'elevate-admin-migration',lms:'elevate-lms-migration',
 marketing:'elevate-marketing-migration',store:'elevate-store-migration'};
function gcloud(args){
 const r=spawnSync('gcloud',args,{encoding:'utf8',maxBuffer:1024*1024});
 if(r.status!==0)throw Error('Cloud read failed; results inconclusive');
 return JSON.parse(r.stdout);
}
export function inspectBinding({component,key}){
 const p=planTokenBootstrap({component,key});
 const project=p.project,region='us-central1';
 const service=gcloud(['run','services','describe',services[component],'--project',project,'--region',region,'--format=json']);
 const env=service.spec?.template?.spec?.containers?.flatMap(c=>c.env??[])??[];
 const bindings=env.filter(e=>e.name===key);
 const unexpected=bindings.some(e=>!e.valueFrom?.secretKeyRef || e.valueFrom.secretKeyRef.name!==p.secretName);
 const references=bindings.map(e=>({key:e.name,secret:e.valueFrom?.secretKeyRef?.name??null,
   version:e.valueFrom?.secretKeyRef?.key??null}));
 const versionAliases=references.some(e=>e.version==='latest');
 return {component,key,service:services[component],
  servingRevision:service.status?.latestReadyRevisionName??null,
  generation:service.metadata?.generation??null,
  observedGeneration:service.status?.observedGeneration??null,
  references, unexpected,versionAliases,
  safeToPlanRotation:references.length===1&&!unexpected&&!versionAliases,
  rotationAction:'No change: stage a new disabled/unused version, test a pinned revision under an approved rollout, then migrate traffic only after health gates',
  noWrites:true};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 try{
  const args=process.argv.slice(2);
  const get=n=>args[args.indexOf(n)+1];
  if(!args.includes('--component')||!args.includes('--key')||args.includes('--apply'))throw Error('Only read-only preflight is supported');
  console.log(JSON.stringify(inspectBinding({component:get('--component'),key:get('--key')})));
 }catch(e){console.error('Binding preflight failed: '+e.message);process.exitCode=1;}
}
