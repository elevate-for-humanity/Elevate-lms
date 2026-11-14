import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {servingPhoneCredential} from './serving-phone-credential.mjs';
const health={ready:true,healthy:true,commit:'a'.repeat(40),revision:'elevate-admin-migration-00203-ggk'};
function fixture(){
  const token=randomBytes(32).toString('base64url'),calls=[];
  const env=[{name:'PBX_RUNTIME_CONFIG_PROVIDER',value:'google-secret-manager'},
    {name:'PBX_PROVISIONING_TOKEN',valueFrom:{secretKeyRef:{name:'elevate-pbx-provisioning-token',key:'7'}}}];
  const state={status:{traffic:[{revisionName:health.revision,percent:100}]}};
  const run=args=>{calls.push(args);if(args[0]==='secrets')return token;
    return JSON.stringify(args[1]==='services'?state:{spec:{containers:[{env}]}});};
  return {token,calls,env,state,run};
}
test('loads only the pinned token from the exact serving revision',()=>{
  const f=fixture();assert.equal(servingPhoneCredential(health,f.run),f.token);
  assert.ok(f.calls[1].includes(health.revision));
  assert.deepEqual(f.calls[2],['secrets','versions','access','7','--secret','elevate-pbx-provisioning-token','--project','elegant-racer-299721']);
});
test('does not read a token for an unhealthy or non-serving revision',()=>{
  const f=fixture();assert.throws(()=>servingPhoneCredential({...health,healthy:false},f.run),/health_unverified/);
  f.state.status.traffic[0].revisionName='different';
  assert.throws(()=>servingPhoneCredential(health,f.run),/traffic_unverified/);
  assert.equal(f.calls.some(args=>args[0]==='secrets'),false);
});
test('rejects latest aliases, other secrets, plaintext and missing authority before credential access',()=>{
  for(const mutation of [f=>f.env[1].valueFrom.secretKeyRef.key='latest',
    f=>f.env[1].valueFrom.secretKeyRef.name='other-secret',f=>f.env[1].value='do-not-expose',
    f=>f.env[0].value='legacy']){
    const f=fixture();mutation(f);
    assert.throws(()=>servingPhoneCredential(health,f.run),error=>/unverified/.test(error.message)&&!error.message.includes('do-not-expose'));
    assert.equal(f.calls.some(args=>args[0]==='secrets'),false);
  }
});
test('supports a whole-service Google binding when no phone override exists',()=>{
  const f=fixture();f.env[0].name='ELEVATE_RUNTIME_CONFIG_PROVIDER';
  assert.equal(servingPhoneCredential(health,f.run),f.token);
});
