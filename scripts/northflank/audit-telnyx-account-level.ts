#!/usr/bin/env tsx
/** Read-only probe for Telnyx account-level, billing, and verification APIs. */
import { nfFetch, projectApiPath, resolveProjectId } from './lib';
type Json = Record<string, any>;
const groupId = process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env';
function findSecret(root: unknown, key: string): string | undefined {
  if (!root || typeof root !== 'object') return;
  if (Array.isArray(root)) {
    for (const item of root) {
      if (item && typeof item === 'object') {
        const row=item as Json;
        if (String(row.key ?? row.name ?? '')===key && typeof (row.value ?? row.secret)==='string') return String(row.value ?? row.secret);
      }
      const found=findSecret(item,key); if(found) return found;
    }
    return;
  }
  const row=root as Json; if(typeof row[key]==='string') return row[key];
  for(const value of Object.values(row)){const found=findSecret(value,key);if(found)return found;}
}
async function main(){
 const projectId=resolveProjectId(); if(!projectId) throw new Error('NORTHFLANK_PROJECT_ID is required');
 const group=await nfFetch<Json>(projectApiPath(projectId,`/secrets/${groupId}`));
 const apiKey=process.env.TELNYX_API_KEY?.trim()||findSecret(group,'TELNYX_API_KEY');
 if(!apiKey) throw new Error('TELNYX_API_KEY is unavailable');
 const endpoints=[
  ['account','/account'],
  ['billing_groups','/billing_groups?page[size]=1'],
  ['auto_recharge','/payment/auto_recharge_preferences'],
  ['identity_verifications','/identity_verifications?page[size]=1'],
  ['managed_accounts','/managed_accounts?page[size]=1'],
  ['balance','/balance'],
 ];
 for(const [name,path] of endpoints){
  const response=await fetch(`https://api.telnyx.com/v2${path}`,{headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'}});
  const body=await response.json().catch(()=>({})) as Json;
  const errorCode=body.errors?.[0]?.code||null;
  console.log('ACCOUNT API '+JSON.stringify({endpoint:name,http_status:response.status,available:response.ok,error_code:errorCode}));
 }
}
main().catch((error)=>{console.error(error instanceof Error?error.message:String(error));process.exit(1);});
