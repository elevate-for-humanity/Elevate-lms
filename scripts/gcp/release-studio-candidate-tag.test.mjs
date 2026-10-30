import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseStudioCandidateTag} from './release-studio-candidate-tag.mjs';
const revision='elevate-studio-browser-00045-wer',old='elevate-studio-browser-00039-yuv';
function fixture({target=revision,tag='studio-verify',percent=0,absent=false,drift=false,courseQa=false,concurrentQa=false,adminUrl='https://studio.run.app',servingAdminUrl=adminUrl,pendingTraffic=false}={}) {
  let removed=false;const calls=[];
  const run=args=>{
    calls.push(args);
    if(args[2]==='update-traffic'){removed=true;return '';}
    if(args[3]==='elevate-admin-migration')return JSON.stringify({status:{traffic:[{revisionName:'elevate-admin-migration-live',percent:100}]},spec:{template:{spec:{containers:[{env:[{name:'STUDIO_BROWSER_URL',value:adminUrl}]}]}}}});
    if(args[1]==='revisions')return JSON.stringify({metadata:{name:args[3],labels:{'serving.knative.dev/service':'elevate-admin-migration'}},spec:{containers:[{env:[{name:'STUDIO_BROWSER_URL',value:servingAdminUrl}]}]}});
    return JSON.stringify({spec:{template:{storage:'preserved',identity:'unchanged'},traffic:pendingTraffic?[{revisionName:revision,percent:100}]:[]},status:{latestCreatedRevisionName:revision,traffic:[
      {revisionName:old,percent:removed&&drift?90:100},
      ...(!removed&&!absent?[{revisionName:target,tag,percent}]:[]),
      ...(courseQa||(removed&&concurrentQa)?[{revisionName:revision,tag:'course-qa-approved',percent:0}]:[]),
    ]}});
  };
  return {run,calls,readConfig:()=>({runtimeEnvironment:{STUDIO_BROWSER_URL:'https://studio.run.app'}}),inventory:async()=>({activeBrowserSessions:0,workspace:{files:0,symlinks:0},directChildShells:0,directNonBrowserProcesses:0,processInventoryReadable:true})};
}
test('releases only the exact unused verification alias without deployment or state changes',async()=>{
  const f=fixture();assert.deepEqual(await releaseStudioCandidateTag({revision,...f}),{changed:true,revision,removedTag:'studio-verify',revisionRetained:true,servingTrafficPreserved:true});
  const writes=f.calls.filter(c=>c[2]==='update-traffic');assert.equal(writes.length,1);
  assert.ok(writes[0].includes('--remove-tags=studio-verify'));
  assert.equal(f.calls.some(c=>c.includes('delete')||c.includes('deploy')||c.includes('secrets')||c.some(a=>a.startsWith('--to-revisions='))),false);
});
test('generated failed-candidate tags release capacity only when no Admin binding or pending traffic references them',async()=>{
 const tag='sc-2aba3de5-c8976733';
 const readConfig=()=>({runtimeEnvironment:{STUDIO_BROWSER_URL:'https://studio.run.app'}});
 const f=fixture({tag});assert.equal((await releaseStudioCandidateTag({revision,tag,...f,readConfig})).removedTag,tag);
 for(const options of [{adminUrl:'https://'+tag+'---studio.run.app'},{pendingTraffic:true},{courseQa:true}]){
  const blocked=fixture({tag,...options});await assert.rejects(()=>releaseStudioCandidateTag({revision,tag,...blocked,readConfig}));assert.equal(blocked.calls.some(c=>c[2]==='update-traffic'),false);
 }
 const pinned=fixture({tag});await assert.rejects(()=>releaseStudioCandidateTag({revision,tag,...pinned,readConfig:()=>({runtimeEnvironment:{STUDIO_BROWSER_PUBLIC_URL:'https://'+tag+'---studio.run.app'}})}),/STILL_REFERENCED/);
 await assert.rejects(()=>releaseStudioCandidateTag({revision,tag:'course-qa-approved',...f}),/TAG_REQUIRED/);
});
test('a repeated cleanup is read-only when the alias is already absent',async()=>{
  const f=fixture({absent:true});assert.equal((await releaseStudioCandidateTag({revision,...f})).changed,false);assert.equal(f.calls.length,1);
});
test('protects production traffic and refuses a concurrently replaced candidate',async()=>{
  for(const [options,requested] of [[{},old],[{target:'elevate-studio-browser-new'},revision],[{percent:5},revision]]){
    const f=fixture(options);await assert.rejects(()=>releaseStudioCandidateTag({revision:requested,...f}));assert.equal(f.calls.some(c=>c[2]==='update-traffic'),false);
  }
});
test('invalid revision cannot enter Google arguments and traffic drift cannot pass readback',async()=>{
  const f=fixture();await assert.rejects(()=>releaseStudioCandidateTag({revision:'--unsafe',...f}));assert.equal(f.calls.length,0);
  await assert.rejects(()=>releaseStudioCandidateTag({revision,...fixture({drift:true})}),/READBACK_REQUIRED/);
});
test('a candidate pinned for course QA cannot be treated as unused headroom',async()=>{
  const f=fixture({courseQa:true});await assert.rejects(()=>releaseStudioCandidateTag({revision,...f}),/STILL_REFERENCED/);
  assert.equal(f.calls.some(c=>c[2]==='update-traffic'),false);
  await assert.rejects(()=>releaseStudioCandidateTag({revision,...fixture({concurrentQa:true})}),/READBACK_REQUIRED/);
});

test('a non-serving verification alias with active browser or shell work remains protected',async()=>{
 for(const change of [{activeBrowserSessions:1},{directChildShells:1},{directNonBrowserProcesses:1},{workspace:{files:1,symlinks:0}},{processInventoryReadable:false}]){
  const f=fixture();
  await assert.rejects(async()=>releaseStudioCandidateTag({revision,...f,inventory:async()=>({activeBrowserSessions:0,workspace:{files:0,symlinks:0},directChildShells:0,directNonBrowserProcesses:0,processInventoryReadable:true,...change})}),/LIVE_STATE_REQUIRES_PRESERVATION/);
  assert.equal(f.calls.some(c=>c[2]==='update-traffic'),false);
 }
});

test('serving Admin references remain protected when its pending template already points elsewhere',async()=>{
 for(const tag of ['studio-verify','sc-2aba3de5-c8976733']){
  const f=fixture({tag,servingAdminUrl:'https://'+tag+'---studio.run.app'});
  await assert.rejects(releaseStudioCandidateTag({revision,tag,...f}),/STILL_REFERENCED/);
  assert.equal(f.calls.some(c=>c[2]==='update-traffic'),false);
 }
});
