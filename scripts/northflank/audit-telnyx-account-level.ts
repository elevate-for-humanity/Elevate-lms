#!/usr/bin/env tsx
/** Read-only probe for Telnyx account-level, billing, and verification APIs. */
import { loadGoogleConfig } from '../gcp/runtime-config.mjs';
type Json = Record<string, any>;
async function main(){
 const config=loadGoogleConfig('admin');
 const apiKey=process.env.TELNYX_API_KEY?.trim()||config.TELNYX_API_KEY;
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
