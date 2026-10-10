import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {checkHostRoute,publicUnit,hostFirewall,edgeStatus} from './prepare-studio-https.mjs';
test('an unrelated hostname cannot be replaced with the browser backend',()=>{const map={name:'elevate-public-routes',hostRules:[{hosts:['admin.elevateforhumanity.org'],pathMatcher:'admin'}],pathMatchers:[]};assert.equal(checkHostRoute(map),false);map.hostRules.push({hosts:['browser.elevateforhumanity.org'],pathMatcher:'admin'});assert.throws(()=>checkHostRoute(map),/requires review/);});
test('accept only the owned browser route',()=>{const map={name:'elevate-public-routes',hostRules:[{hosts:['browser.elevateforhumanity.org'],pathMatcher:'studio-browser'}],pathMatchers:[{name:'studio-browser',defaultService:'global/backendServices/elevate-studio-browser-backend'}]};assert.equal(checkHostRoute(map),true);map.pathMatchers[0].pathRules=[{paths:['/*']}];assert.throws(()=>checkHostRoute(map),/review/);});
test('private publication installs the source firewall before the container starts',()=>{const unit=publicUnit('10.128.0.3');assert.ok(unit.includes('--publish=10.128.0.3:3100:3100'));assert.ok(unit.includes('ExecStartPre=/usr/local/sbin/elevate-studio-firewall'));assert.ok(!unit.includes('--publish=0.0.0.0'));assert.throws(()=>publicUnit('8.8.8.8'),/private/);assert.ok(hostFirewall.includes('-j DROP'));execFileSync('bash',['-n'],{input:hostFirewall});});
test('HTTP rejection is distinct from connection failure and secrets never enter argv or evidence',()=>{
  const secret='private-probe-credential';
  const rejected=edgeStatus('34.110.235.233',secret,(command,args,options)=>{assert.equal(command,'curl');assert.ok(!args.join(' ').includes(secret));assert.ok(options.input.includes(secret));return {status:0,stdout:'401',stderr:secret};});
  assert.deepEqual(rejected,{exitCode:0,httpStatus:401,timedOut:false});
  const failed=edgeStatus('34.110.235.233',secret,()=>({status:28,stdout:'000',stderr:secret}));
  assert.deepEqual(failed,{exitCode:28,httpStatus:null,timedOut:false});assert.ok(!JSON.stringify([rejected,failed]).includes(secret));
});
