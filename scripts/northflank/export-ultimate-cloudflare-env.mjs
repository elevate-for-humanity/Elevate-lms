#!/usr/bin/env node
import fs from 'node:fs';
const token=process.env.NORTHFLANK_API_TOKEN?.trim();const githubEnv=process.env.GITHUB_ENV;
if(!token)throw new Error('Missing NORTHFLANK_API_TOKEN');if(!githubEnv)throw new Error('GITHUB_ENV unavailable');
const base='https://api.northflank.com/v1/projects/elevate-platform';
const ids=['elevate-production-env','elevate-llm-client-env'];
async function get(path){const r=await fetch(base+path,{headers:{authorization:'Bearer '+token,accept:'application/json'},signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error('Northflank '+r.status+' '+path);const j=await r.json();return j.data??j;}
const vars={};for(const id of ids){try{const g=await get('/secrets/'+id+'/details');Object.assign(vars,g?.secrets?.variables??g?.variables??{});}catch{}}
const account=vars.CLOUDFLARE_ACCOUNT_ID;const api=vars.CLOUDFLARE_AI_API_TOKEN||vars.CLOUDFLARE_API_TOKEN;const model=vars.CLOUDFLARE_AI_MODEL;const gateway=vars.AI_GATEWAY_ID||'default';
if(!account||!api||!model)throw new Error('Canonical Cloudflare AI configuration missing from Northflank');
for(const v of [account,api,model,gateway])console.log('::add-mask::'+v);
fs.appendFileSync(githubEnv,`CLOUDFLARE_ACCOUNT_ID=${account}\nCLOUDFLARE_AI_API_TOKEN=${api}\nCLOUDFLARE_AI_MODEL=${model}\nAI_GATEWAY_ID=${gateway}\nAI_PROVIDER=cloudflare\n`,{encoding:'utf8',mode:0o600});
console.log('Canonical Cloudflare AI configuration loaded for Ultimate worker.');
