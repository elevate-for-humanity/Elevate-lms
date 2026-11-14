import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pushWorkspaceRepository,unsafeGitConfigurationPattern} from './repository-push.mjs';
const sha='a'.repeat(40),token='ghs_fixture_secret_not_for_logs';
function fixture(overrides={}){const calls=[];const run=async(binary,args,options)=>{calls.push({binary,args,options});if(args[0]==='remote')return {stdout:overrides.origin||'https://github.com/elevate-for-humanity/Elevate-lms.git'};if(args[0]==='symbolic-ref')return {stdout:'main'};if(args[0]==='rev-parse')return {stdout:sha};if(args[0]==='config'){if(overrides.routing)return {stdout:'url.evil.insteadOf https://github.com/'};throw Object.assign(Error('none'),{code:1});}if(args[0]==='ls-remote')return {stdout:(overrides.remote||sha)+'\trefs/heads/main'};if(args[0]==='push'&&overrides.fail)throw Error(token);return {stdout:''};};return {calls,run};}
test('uses an ephemeral credential only for the canonical non-force push and verifies remote SHA',async()=>{
 const f=fixture();assert.equal((await pushWorkspaceRepository({root:'/repo',branch:'main',expectedSha:sha,token},f.run)).verified,true);
 assert.ok(f.calls.every(call=>!JSON.stringify(call.args).includes(token)));
 const push=f.calls.find(call=>call.args[0]==='push');assert.deepEqual(push.args,['push','--porcelain','https://github.com/elevate-for-humanity/Elevate-lms.git','HEAD:refs/heads/main']);assert.equal(push.options.env.GIT_CONFIG_VALUE_1,'');
});
test('refuses an unrelated origin, changed checkout and credential redirection before pushing',async()=>{
 for(const options of [{origin:'https://other.test/repo.git'},{routing:true}]){const f=fixture(options);await assert.rejects(pushWorkspaceRepository({root:'/repo',branch:'main',expectedSha:sha,token},f.run));assert.ok(!f.calls.some(c=>c.args[0]==='push'));}
 const f=fixture();await assert.rejects(pushWorkspaceRepository({root:'/repo',branch:'main',expectedSha:'b'.repeat(40),token},f.run),/changed/);
});
test('does not claim success on a rejected push or mismatched remote and never exposes token errors',async()=>{
 for(const options of [{fail:true},{remote:'b'.repeat(40)}]){const f=fixture(options);await assert.rejects(pushWorkspaceRepository({root:'/repo',branch:'main',expectedSha:sha,token},f.run),error=>error.message==='github_push_not_verified_check_remote_before_retry'&&!error.message.includes(token));}
});

test('matches actual normalized Git URL rewrites and credential transport overrides',()=>{
 for(const setting of [
  'url.https://example.invalid/.insteadOf=https://github.com/',
  'url.https://example.invalid/.pushInsteadOf=https://github.com/',
  'http.extraHeader=Authorization: private-fixture',
  'http.sslVerify=false','http.proxy=https://example.invalid/',
  'http.https://github.com/.sslCAInfo=/tmp/foreign-ca',
  'protocol.ext.allow=always',
 ]){
  const output=execFileSync('git',['-c',setting,'config','--get-regexp',unsafeGitConfigurationPattern],{encoding:'utf8'});
  assert.ok(output.trim(),setting.split('=')[0]);
 }
});
test('pins transport and TLS configuration even while a checkout changes',async()=>{
 const f=fixture();await pushWorkspaceRepository({root:'/repo',branch:'main',expectedSha:sha,token},f.run);
 for(const call of f.calls.filter(c=>['push','ls-remote'].includes(c.args[0]))){
  const env=call.options.env;assert.equal(env.GIT_ALLOW_PROTOCOL,'https');assert.equal(env.GIT_CONFIG_NOSYSTEM,'1');assert.equal(env.GIT_CONFIG_GLOBAL,'/dev/null');
  const config=Object.fromEntries(Array.from({length:Number(env.GIT_CONFIG_COUNT)},(_,i)=>[env['GIT_CONFIG_KEY_'+i],env['GIT_CONFIG_VALUE_'+i]]));
  assert.equal(config['http.sslVerify'],'true');assert.equal(config['http.followRedirects'],'false');assert.equal(config['http.proxy'],'');assert.equal(config['core.hooksPath'],'/dev/null');
 }
});
