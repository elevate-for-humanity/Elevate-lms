import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseStudioCandidateTag} from './release-studio-candidate-tag.mjs';
const revision='elevate-studio-browser-00045-wer',old='elevate-studio-browser-00039-yuv';
function fixture({target=revision,percent=0,absent=false,drift=false}={}) {
  let removed=false;const calls=[];
  const run=args=>{
    calls.push(args);
    if(args[2]==='update-traffic'){removed=true;return '';}
    return JSON.stringify({spec:{template:{storage:'preserved',identity:'unchanged'}},status:{latestCreatedRevisionName:revision,traffic:[
      {revisionName:old,percent:removed&&drift?90:100},
      ...(!removed&&!absent?[{revisionName:target,tag:'studio-verify',percent}]:[]),
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
