import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {timingSafeEqual,randomBytes} from 'node:crypto';
import {usesGooglePhoneBindings} from '../lib/phone/runtime-authority.ts';
const source=readFileSync(new URL('../apps/admin/app/api/internal/phone/voicemail/route.ts',import.meta.url),'utf8');
const executable=stripTypeScriptTypes(source.replace(/^import .*;\n/gm,'')).replace(/^export /gm,'');
const id='11111111-1111-4111-a111-111111111111';
const audio=Buffer.alloc(44);audio.write('RIFF');audio.write('WAVE',8);
test('phone-specific Google authority works through real non-delivering voicemail handler',async()=>{
  const previous={...process.env},originalFetch=globalThis.fetch;
  const token=randomBytes(32).toString('base64url');
  try{
    process.env.PBX_RUNTIME_CONFIG_PROVIDER='google-secret-manager';
    delete process.env.ELEVATE_RUNTIME_CONFIG_PROVIDER;
    process.env.PBX_PROVISIONING_TOKEN=token;process.env.PBX_PHONE_SYSTEM_ID=id;
    let writes=0,notices=0,dbReads=0;
    const db={from(table){dbReads++;const query={select(){return query;},eq(){return query;},
      async maybeSingle(){return {data:table==='phone_systems'?{id,status:'active',voicemail_enabled:true}:
        table==='communication_workspaces'?{id:'workspace'}:table==='communication_extensions'?{id:'extension',profile_id:'recipient'}:null,error:null};},
      upsert(){writes++;return query;}};return query;}};
    globalThis.fetch=async url=>Response.json(String(url).includes('169.254')?{access_token:'test-identity'}:{results:[{alternatives:[{transcript:'Please return my call.'}]}]});
    const POST=new Function('NextResponse','timingSafeEqual','hydrateProcessEnv','requireAdminClient','notifyAssignee','usesGooglePhoneBindings',`${executable}\nreturn POST;`)(
      Response,timingSafeEqual,async()=>{},async()=>db,async()=>{notices++;},usesGooglePhoneBindings);
    const request=secret=>new Request('https://example.test/api/internal/phone/voicemail',{method:'POST',headers:{Authorization:'Bearer '+secret},body:JSON.stringify({id,extension:'0',caller:'unknown',durationSeconds:2,createdAt:new Date().toISOString(),audioBase64:audio.toString('base64'),validateOnly:true})});
    const result=await POST(request(token));
    assert.equal(result.status,200);assert.deepEqual(await result.json(),{validated:true,transcriptAvailable:true});
    assert.equal(writes,0);assert.equal(notices,0);assert.ok(dbReads>0);
    dbReads=0;assert.equal((await POST(request('invalid'))).status,401);assert.equal(dbReads,0);
    delete process.env.PBX_RUNTIME_CONFIG_PROVIDER;
    assert.equal((await POST(request(token))).status,503);assert.equal(dbReads,0);
  }finally{
    for(const key of Object.keys(process.env))if(!(key in previous))delete process.env[key];
    Object.assign(process.env,previous);globalThis.fetch=originalFetch;
  }
});
test('explicit phone provider takes precedence while whole-service Google remains compatible',()=>{
  assert.equal(usesGooglePhoneBindings({ELEVATE_RUNTIME_CONFIG_PROVIDER:'google-secret-manager'}),true);
  assert.equal(usesGooglePhoneBindings({PBX_RUNTIME_CONFIG_PROVIDER:'legacy',ELEVATE_RUNTIME_CONFIG_PROVIDER:'google-secret-manager'}),false);
  assert.equal(usesGooglePhoneBindings({}),false);
});
