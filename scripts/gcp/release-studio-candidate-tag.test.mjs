import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseStudioCandidateTag} from './release-studio-candidate-tag.mjs';
const revision='elevate-studio-browser-00045-wer',old='elevate-studio-browser-00039-yuv';
function fixture({target=revision,tag='studio-verify',percent=0,absent=false,drift=false,courseQa=false,concurrentQa=false,adminUrl='https://studio.run.app',pendingTraffic=false}={}) {
  let removed=false;const calls=[];
  const run=args=>{
    calls.push(args);
    if(args[2]==='update-traffic'){removed=true;return '';}
    if(args[3]==='elevate-admin-migration')return JSON.stringify({spec:{template:{spec:{containers:[{env:[{name:'STUDIO_BROWSER_URL',value:adminUrl}]}]}}}});
    return JSON.stringify({spec:{template:{storage:'preserved',identity:'unchanged'},traffic:pendingTraffic?[{revisionName:revision,percent:100}]:[]},status:{latestCreatedRevisionName:revision,traffic:[
      {revisionName:old,percent:removed&&drift?90:100},
      ...(!removed&&!absent?[{revisionName:target,tag,percent}]:[]),
      ...(courseQa||(removed&&concurrentQa)?[{revisionName:revision,tag:'course-qa-approved',percent:0}]:[]),
    ]}});
  };
  return {run,calls};
}
test('releases only the exact unused verification alias without deployment or state changes',()=>{
  const f=fixture();assert.deepEqual(releaseStudioCandidateTag({revision,run:f.run}),{changed:true,revision,removedTag:'studio-verify',revisionRetained:true,servingTrafficPreserved:true});
  const writes=f.calls.filter(c=>c[2]==='update-traffic');assert.equal(writes.length,1);
  assert.ok(writes[0].includes('--remove-tags=studio-verify'));
  assert.equal(f.calls.some(c=>c.includes('delete')||c.includes('deploy')||c.includes('secrets')||c.some(a=>a.startsWith('--to-revisions='))),false);
});
test('generated failed-candidate tags release capacity only when no Admin binding or pending traffic references them',()=>{
 const tag='sc-2aba3de5-c8976733';
 const readConfig=()=>({runtimeEnvironment:{STUDIO_BROWSER_URL:'https://studio.run.app'}});
 const f=fixture({tag});assert.equal(releaseStudioCandidateTag({revision,tag,run:f.run,readConfig}).removedTag,tag);
 for(const options of [{adminUrl:'https://'+tag+'---studio.run.app'},{pendingTraffic:true},{courseQa:true}]){
  const blocked=fixture({tag,...options});assert.throws(()=>releaseStudioCandidateTag({revision,tag,run:blocked.run,readConfig}));assert.equal(blocked.calls.some(c=>c[2]==='update-traffic'),false);
 }
 const pinned=fixture({tag});assert.throws(()=>releaseStudioCandidateTag({revision,tag,run:pinned.run,readConfig:()=>({runtimeEnvironment:{STUDIO_BROWSER_PUBLIC_URL:'https://'+tag+'---studio.run.app'}})}),/STILL_REFERENCED/);
 assert.throws(()=>releaseStudioCandidateTag({revision,tag:'course-qa-approved',run:f.run}),/TAG_REQUIRED/);
});
test('a repeated cleanup is read-only when the alias is already absent',()=>{
  const f=fixture({absent:true});assert.equal(releaseStudioCandidateTag({revision,run:f.run}).changed,false);assert.equal(f.calls.length,1);
});
test('protects production traffic and refuses a concurrently replaced candidate',()=>{
  for(const [options,requested] of [[{},old],[{target:'elevate-studio-browser-new'},revision],[{percent:5},revision]]){
    const f=fixture(options);assert.throws(()=>releaseStudioCandidateTag({revision:requested,run:f.run}));assert.equal(f.calls.some(c=>c[2]==='update-traffic'),false);
  }
});
test('invalid revision cannot enter Google arguments and traffic drift cannot pass readback',()=>{
  const f=fixture();assert.throws(()=>releaseStudioCandidateTag({revision:'--unsafe',run:f.run}));assert.equal(f.calls.length,0);
  assert.throws(()=>releaseStudioCandidateTag({revision,run:fixture({drift:true}).run}),/READBACK_REQUIRED/);
});
test('a candidate pinned for course QA cannot be treated as unused headroom',()=>{
  const f=fixture({courseQa:true});assert.throws(()=>releaseStudioCandidateTag({revision,run:f.run}),/STILL_REFERENCED/);
  assert.equal(f.calls.some(c=>c[2]==='update-traffic'),false);
  assert.throws(()=>releaseStudioCandidateTag({revision,run:fixture({concurrentQa:true}).run}),/READBACK_REQUIRED/);
});
