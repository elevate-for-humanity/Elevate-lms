import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {bindControl,bindingPlan,bindingsMatch,pinnedControlVersion} from './bind-pbx-control-runtime.mjs';
const commit='a'.repeat(40),image='us-central1-docker.pkg.dev/elegant-racer-299721/elevate/lms@sha256:'+'b'.repeat(64);
function fixture(){
  let state={spec:{template:{spec:{serviceAccountName:'elevate-lms-runtime@elegant-racer-299721.iam.gserviceaccount.com',containers:[{image,env:[{name:'UNRELATED',value:'keep'}]}]}}},
    status:{latestReadyRevisionName:'existing',latestCreatedRevisionName:'existing',traffic:[{revisionName:'existing',percent:100}]}};
  const calls=[];
  const dependencies={runId:'123',cleanup:async()=>{},preflight:async()=>{},
    request:async()=>({ok:true,json:async()=>({healthy:true,ready:true,revision:'existing',commit})}),
    run:args=>{
      calls.push(args);
      if(args.slice(0,3).join(' ')==='run services describe')return JSON.stringify(state);
      if(args.slice(0,3).join(' ')==='secrets get-iam-policy elevate-pbx-provisioning-token')return '{"bindings":[]}';
      if(args.slice(0,2).join(' ')==='secrets add-iam-policy-binding')return '';
      if(args.slice(0,3).join(' ')==='run services update'){
        assert.ok(args.includes('--no-traffic'));
        state=structuredClone(state);
        const plan=bindingPlan('lms','1');
        state.spec.template.spec.containers[0].env.push(...Object.entries(plan.vars).map(([name,value])=>({name,value})),
          {name:plan.secret.name,valueFrom:{secretKeyRef:{name:plan.secret.secret,key:plan.secret.version}}});
        state.status.latestCreatedRevisionName='elevate-lms-migration-pbx-control-123';
        return '';
      }
      if(args.slice(0,3).join(' ')==='run revisions describe')return JSON.stringify({spec:state.spec.template.spec});
      throw Error('Unexpected operation');
    },
    activate:async options=>{
      state.status.latestReadyRevisionName=options.revision;
      state.status.traffic=[{revisionName:options.revision,percent:100}];
      return {revision:options.revision,commit:options.commit};
    }};
  return {dependencies,calls,env:()=>state.spec.template.spec.containers[0].env};
}
test('binding plans are confined to the approved two applications and existing token',()=>{
  assert.throws(()=>bindingPlan('marketing','1'));
  assert.throws(()=>bindingPlan('lms','latest'));
  assert.equal(bindingPlan('admin','1').vars.PBX_PHONE_SYSTEM_ID,'341f59a3-b1d6-4360-8463-0ce0402f86fe');
  assert.equal(bindingPlan('lms','1').vars.PBX_CONTROL_URL,'https://phone.elevateforhumanity.org');
});
test('reads only the VM reference and metadata, never a secret payload',async()=>{
  const calls=[];
  const version=await pinnedControlVersion((args,code)=>{
    calls.push(args);
    if(args[0]==='compute'){
      assert.equal(code,undefined,'SSH must not require stdin');
      const index=args.indexOf('--command');
      assert.ok(index>=0);
      const command=args[index+1];
      assert.ok(command.startsWith('sudo python3 -c '));
      const quoted=command.slice('sudo python3 -c '.length);
      assert.ok(quoted.startsWith("'")&&quoted.endsWith("'"));
      const source=quoted.slice(1,-1).split("'\\''").join("'");
      const compiled=spawnSync('python3',['-c',"import sys; compile(sys.stdin.read(), '<probe>', 'exec')"],{input:source,encoding:'utf8'});
      assert.equal(compiled.status,0,compiled.stderr);
      return '1';
    }
    return JSON.stringify({name:'projects/484736877039/secrets/elevate-pbx-provisioning-token/versions/1',state:'ENABLED'});
  });
  assert.equal(version,'1');
  assert.equal(calls.some(args=>args.includes('access')),false);
});
test('updates only phone bindings and verifies the actual revision after promotion',async()=>{
  const f=fixture(); const result=await bindControl('lms','1',f.dependencies);
  assert.equal(result.phoneBindingsVerified,true);
  assert.equal(result.callAcceptance,'NOT TESTED');
  assert.ok(bindingsMatch(f.env(),bindingPlan('lms','1')));
  assert.deepEqual(f.env().find(e=>e.name==='UNRELATED'),{name:'UNRELATED',value:'keep'});
  assert.equal(f.calls.some(args=>args.includes('--image')||args.includes('--set-env-vars')),false);
  const grant=f.calls.find(args=>args.includes('add-iam-policy-binding'));
  assert.ok(grant.includes('serviceAccount:elevate-lms-runtime@elegant-racer-299721.iam.gserviceaccount.com'));
  assert.ok(grant.includes('elevate-pbx-provisioning-token'));
});
test('an unexpected existing credential is never overwritten or printed',async()=>{
  const f=fixture();f.env().push({name:'PBX_PROVISIONING_TOKEN',value:'DO_NOT_PRINT'});
  await assert.rejects(bindControl('lms','1',f.dependencies),error=>error.message==='existing_phone_credential_requires_review'&&!error.message.includes('DO_NOT_PRINT'));
  assert.equal(f.calls.some(args=>args.includes('update')||args.includes('add-iam-policy-binding')),false);
});
test('matching live bindings cause no deployment or IAM changes',async()=>{
  const f=fixture(),plan=bindingPlan('lms','1');
  f.env().push(...Object.entries(plan.vars).map(([name,value])=>({name,value})),{name:plan.secret.name,valueFrom:{secretKeyRef:{name:plan.secret.secret,key:'1'}}});
  const result=await bindControl('lms','1',f.dependencies);
  assert.equal(result.changed,false);
  assert.equal(f.calls.some(args=>args.includes('update')||args.includes('add-iam-policy-binding')),false);
});
test('a failed capacity check prevents credential access and candidate mutation',async()=>{
  const f=fixture();f.dependencies.preflight=async()=>{throw Error('capacity blocked')};
  await assert.rejects(bindControl('lms','1',f.dependencies),/capacity blocked/);
  assert.equal(f.calls.some(args=>args[0]==='secrets'||args.includes('update')),false);
});
