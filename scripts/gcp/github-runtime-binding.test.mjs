import test from 'node:test';
import assert from 'node:assert/strict';
import {githubRuntimeBinding} from './github-runtime-binding.mjs';
function fixture({status=200,state='ENABLED',secret='elevate-admin-github-token',deny=false}={}){
 const calls=[];return{calls,deps:{run:args=>{calls.push(args);if(deny)throw Error('private upstream');return args[2]==='describe'?JSON.stringify({name:'projects/484736877039/secrets/'+secret+'/versions/3',state}):'github_pat_private_fixture';},request:async(_url,init)=>{assert.equal(init.redirect,'error');assert.equal(init.cache,'no-store');return new Response(null,{status});}}};
}
test('Google reads the exact verified runtime token name and emits a pinned secret reference only',async()=>{const f=fixture();const flags=await githubRuntimeBinding(f.deps);assert.deepEqual(flags,['--remove-env-vars=GITHUB_TOKEN','--update-secrets=GITHUB_TOKEN=elevate-admin-github-token:3']);assert.ok(!flags.join().includes('private_fixture'));assert.equal(f.calls[1][3],'3');});
test('missing, disabled or wrong secret never emits deployment flags',async()=>{for(const options of [{deny:true},{state:'DISABLED'},{secret:'other'}])await assert.rejects(githubRuntimeBinding(fixture(options).deps),/SECRET_UNAVAILABLE/);});
test('rejected tokens and upstream outages remain real failures',async()=>{for(const status of [401,403,404,503])await assert.rejects(githubRuntimeBinding(fixture({status}).deps),new RegExp(status===503?'CHECK_UNAVAILABLE':'TOKEN_REJECTED'));});
