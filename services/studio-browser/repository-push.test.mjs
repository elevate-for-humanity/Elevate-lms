import test from 'node:test';
import assert from 'node:assert/strict';
import {pushWorkspaceRepository} from './repository-push.mjs';
const sha='a'.repeat(40),token='ghs_fixture_secret_not_for_logs';
function fixture(overrides={}){const calls=[];const run=async(binary,args,options)=>{calls.push({binary,args,options});if(args[0]==='remote')return {stdout:overrides.origin||'https://github.com/elevate-for-humanity/Elevate-lms.git'};if(args[0]==='symbolic-ref')return {stdout:'main'};if(args[0]==='rev-parse')return {stdout:sha};if(args[0]==='config'){if(overrides.routing)return {stdout:'url.evil.insteadOf https://github.com/'};throw Object.assign(Error('none'),{code:1});}if(args[0]==='ls-remote')return {stdout:(overrides.remote||sha)+'\trefs/heads/main'};if(args[0]==='push'&&overrides.fail)throw Error(token);return {stdout:''};};return {calls,run};}
test('uses an ephemeral credential only for the canonical non-force push and verifies remote SHA',async()=>{
 const f=fixture();assert.equal((await pushWorkspaceRepository({root:'/repo',branch:'main',expectedSha:sha,token},f.run)).verified,true);
 assert.ok(f.calls.every(call=>!JSON.stringify(call.args).includes(token)));
 const push=f.calls.find(call=>call.args[0]==='push');assert.deepEqual(push.args,['push','--porcelain','origin','HEAD:refs/heads/main']);assert.equal(push.options.env.GIT_CONFIG_VALUE_1,'');
});
test('refuses an unrelated origin, changed checkout and credential redirection before pushing',async()=>{
 for(const options of [{origin:'https://other.test/repo.git'},{routing:true}]){const f=fixture(options);await assert.rejects(pushWorkspaceRepository({root:'/repo',branch:'main',expectedSha:sha,token},f.run));assert.ok(!f.calls.some(c=>c.args[0]==='push'));}
 const f=fixture();await assert.rejects(pushWorkspaceRepository({root:'/repo',branch:'main',expectedSha:'b'.repeat(40),token},f.run),/changed/);
});
test('does not claim success on a rejected push or mismatched remote and never exposes token errors',async()=>{
 for(const options of [{fail:true},{remote:'b'.repeat(40)}]){const f=fixture(options);await assert.rejects(pushWorkspaceRepository({root:'/repo',branch:'main',expectedSha:sha,token},f.run),error=>error.message==='github_push_not_verified_check_remote_before_retry'&&!error.message.includes(token));}
});
