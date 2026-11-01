import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recoverQuickBooksAuthorization} from './recover-quickbooks-authorization.mjs';
function fixture({allInvalid=false,company='123',saved=true}={}){
 const configs=Object.fromEntries(['admin','marketing','lms','store'].map(component=>[component,{version:1,component,runtimeEnvironment:{SUPABASE_URL:'https://cuxzzpsyufcewtmicszk.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'private-service',QB_CLIENT_ID:'runtime-id',QB_CLIENT_SECRET:'runtime-secret'},runtimeFiles:{},volumes:[]}]));
 const calls=[],writes=[];let refresh='original-refresh';
 const run=args=>{
  if(args[1]==='versions'&&args[2]==='access')return JSON.stringify(configs[args[5].replace('elevate-','').replace('-runtime-config','')]);
  if(args[1]==='versions'&&args[2]==='add'){
   const value=JSON.parse(readFileSync(args[args.indexOf('--data-file')+1],'utf8'));configs[value.component]=value;writes.push(value.component);return 'stored';
  }throw Error('unexpected operation');
 };
 const request=async(url,init)=>{
  calls.push({url,init});
  if(url.includes('/app_settings?'))return Response.json(Object.entries({QB_CLIENT_ID:'canonical-id',QB_CLIENT_SECRET:'canonical-secret',QB_REFRESH_TOKEN:refresh,QB_REALM_ID:'123'}).map(([key,value])=>({key,value})));
  if(url.endsWith('/get_platform_secret'))return Response.json(JSON.parse(init.body).p_key==='QB_CLIENT_ID'?'canonical-id':'canonical-secret');
  if(url.includes('tokens/bearer'))return allInvalid||init.headers.Authorization===('Basic '+Buffer.from('canonical-id:canonical-secret').toString('base64'))?Response.json({error:'invalid_grant'},{status:400}):Response.json({access_token:'private-access',refresh_token:'private-rotated',expires_in:3600});
  if(url.includes('/companyinfo/'))return Response.json({CompanyInfo:{Id:company}});
  if(url.endsWith('/save_verified_quickbooks_authorization')){if(saved)refresh='private-rotated';return Response.json(saved);}
  throw Error('unexpected destination');
 };return {run,request,calls,writes};
}
test('recovers with an existing issuing client only after company verification and durable compare-and-set',async()=>{
 const f=fixture(),result=await recoverQuickBooksAuthorization(f);
 assert.equal(result.recovered,true);assert.equal(result.issuingClientSource,'google-admin');assert.equal(f.writes.length,4);
 for(const value of ['private-access','private-rotated','runtime-secret','private-service'])assert(!JSON.stringify(result).includes(value));
 const save=f.calls.findIndex(row=>row.url.endsWith('/save_verified_quickbooks_authorization')),company=f.calls.findIndex(row=>row.url.includes('/companyinfo/'));
 assert(company<save);assert.equal(JSON.parse(f.calls[save].init.body).p_expected_refresh_token,'original-refresh');
});
test('does not overwrite settings or configurations if every existing client fails',async()=>{
 const f=fixture({allInvalid:true}),result=await recoverQuickBooksAuthorization(f);
 assert.equal(result.recovered,false);assert.equal(result.consentRequired,true);assert.equal(f.writes.length,0);
 assert(!f.calls.some(row=>row.url.endsWith('/save_verified_quickbooks_authorization')));
});
test('refuses a different company and preserves newer consent',async()=>{
 const wrong=fixture({company:'999'}),result=await recoverQuickBooksAuthorization(wrong);
 assert.equal(result.recovered,false);assert.equal(wrong.writes.length,0);
 assert.equal(result.attempts.at(-1).realmMatched,false);
 const newer=fixture({saved:false});await assert.rejects(()=>recoverQuickBooksAuthorization(newer));assert.equal(newer.writes.length,0);
});
