import {test} from 'node:test';
import assert from 'node:assert/strict';
import {configureDatabase,productionCredentials,REDIRECT,SOURCE} from './configure-quickbooks-production.mjs';
const env={QB_CLIENT_ID:'AB36wjMVx59aNggdTvM8qhnTGgmvuRPkx3a4efcXCkmeo6mFWL',QB_CLIENT_SECRET:'fixtureProductionSecret1234',SUPABASE_SERVICE_ROLE_KEY:'fixture-database-key'};
test('reject mismatched applications and copied UI labels before database writes',()=>{
 assert.throws(()=>productionCredentials({...env,QB_CLIENT_ID:'wrong-app'}));
 assert.throws(()=>productionCredentials({...env,QB_CLIENT_SECRET:env.QB_CLIENT_SECRET+'\nRotate secret'}));
});
test('bind complete pair and require exact canonical readback without reporting connected',async()=>{
 const expected={QB_CLIENT_ID:env.QB_CLIENT_ID,QB_CLIENT_SECRET:env.QB_CLIENT_SECRET,QB_ENVIRONMENT:'production',QB_REDIRECT_URI:REDIRECT};const calls=[];
 const request=async(url,init)=>{assert.ok(url.startsWith(SOURCE+'/rest/v1/rpc/'));const body=JSON.parse(init.body);calls.push({url,body});return Response.json(url.endsWith('/configure_quickbooks_oauth_application')?true:expected[body.p_key]);};
 const result=await configureDatabase({env,request});
 assert.equal(calls.length,5);assert.equal(calls[0].body.p_client_secret,env.QB_CLIENT_SECRET);assert.equal(result.companyAuthorizationVerified,false);assert.ok(!JSON.stringify(result).includes(env.QB_CLIENT_SECRET));
 await assert.rejects(()=>configureDatabase({env,request:async()=>Response.json('wrong')}),/UNVERIFIED/);
});
test('Google alignment preserves unrelated configuration and verifies serving credentials',async()=>{
 const {configureGoogle}=await import('./configure-quickbooks-production.mjs');
 const {readFileSync}=await import('node:fs');const configs={},active={},writes=[];
 for(const component of ['admin','marketing','lms','store'])configs[component]={version:1,component,runtimeEnvironment:{UNRELATED:'preserved',QB_ACCESS_TOKEN:'obsolete'},runtimeFiles:{},volumes:[]};
 const run=args=>{
  const component=(args.find(a=>/^elevate-(admin|marketing|lms|store)-/.test(a))||'').split('-')[1];
  if(args[0]==='secrets'&&args[1]==='versions'&&args[2]==='access')return JSON.stringify(configs[component]);
  if(args[0]==='secrets'&&args[1]==='versions'&&args[2]==='add'){configs[component]=JSON.parse(readFileSync(args[args.indexOf('--data-file')+1],'utf8'));writes.push(args);return 'version/1';}
  if(args[1]==='services'&&args[2]==='update'){const flags=JSON.parse(readFileSync(args[args.indexOf('--flags-file')+1],'utf8'));active[component]=flags['--update-env-vars'];assert.ok(flags['--remove-env-vars'].includes('QB_REFRESH_TOKEN'));assert.ok(!args.some(a=>a.startsWith('--image')));return component+'-ready';}
  if(args[1]==='services'&&args[2]==='describe')return JSON.stringify({status:{traffic:[{percent:100,revisionName:component+'-ready'}]}});
  if(args[1]==='revisions'&&args[2]==='describe'){const part=args[3].split('-')[0];return JSON.stringify({spec:{containers:[{env:Object.entries(active[part]).map(([name,value])=>({name,value}))}]}});}
  throw Error('unexpected operation');
 };
 const result=configureGoogle({env,run});assert.equal(result.services.length,4);assert.equal(writes.length,4);
 for(const config of Object.values(configs)){assert.equal(config.runtimeEnvironment.UNRELATED,'preserved');assert.equal(config.runtimeEnvironment.QB_ACCESS_TOKEN,undefined);assert.equal(config.runtimeEnvironment.QB_CLIENT_SECRET,env.QB_CLIENT_SECRET);}
 assert.equal(result.companyAuthorizationVerified,false);assert.ok(!JSON.stringify(result).includes(env.QB_CLIENT_SECRET));
});
