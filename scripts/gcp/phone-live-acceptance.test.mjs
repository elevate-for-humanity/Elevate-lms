import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyOwner,verifyCredential,operatorAudioPassed,verifyVoicemailEvidence,verifyHandsetAuthorization,voicemailCallerEvidence} from './phone-live-acceptance.mjs';
const profileId='964dc85a-bce8-4e67-92eb-198ffafb2384',extensionId='ea5439e0-014b-4020-8e25-e305f20c53d6';
const system={id:'341f59a3-b1d6-4360-8463-0ce0402f86fe',status:'active',admin_extension:'0',voicemail_enabled:true};
const extension={id:extensionId,profile_id:profileId,extension:'0',enabled:true,webrtc_provider:'asterisk'};
const profile={id:profileId,full_name:'Elizabeth Greene',email:'curvaturebodysculpting@gmail.com'};
test('handset call requires exact stored owner forwarding, live brand route and a first authorized attempt',()=>{
 const owner={...extension,admin_external_fallback:true,external_fallback_number:'+13179562748'};
 const live={adminCellularFallbackConfigured:true,adminBrandCallerIdConfigured:true};
 verifyHandsetAuthorization(owner,live,'317-956-2748','1');
 for(const bad of [{...owner,external_fallback_number:'+15555555555'},{...owner,admin_external_fallback:false},{...owner,profile_id:extensionId},{...owner,enabled:false}])assert.throws(()=>verifyHandsetAuthorization(bad,live,'317-956-2748','1'),/HANDSET_AUTHORIZATION_REQUIRED/);
 for(const [config,authority,attempt] of [[live,'','1'],[live,'317-956-2748','2'],[{...live,adminBrandCallerIdConfigured:false},'317-956-2748','1']])assert.throws(()=>verifyHandsetAuthorization(owner,config,authority,attempt),/HANDSET_AUTHORIZATION_REQUIRED/);
});
test('ownership must match the approved phone system, extension and Elizabeth before any call',()=>{
 verifyOwner(system,extension,profile);
 for(const bad of [{...profile,email:'someone@example.org'},{...profile,id:extensionId}])assert.throws(()=>verifyOwner(system,extension,bad),/OWNER_UNVERIFIED/);
 assert.throws(()=>verifyOwner(system,{...extension,extension:'101'},profile),/OWNER_UNVERIFIED/);
 assert.throws(()=>verifyOwner({...system,voicemail_enabled:false},extension,profile),/OWNER_UNVERIFIED/);
});
test('temporary credentials cannot change the device owner or SIP host',()=>{
 const identity={profileId,extensionId,deviceId:'asterisk_acceptance_test'};
 const endpoint='pwa-'+createHash('sha256').update(profileId+':'+identity.deviceId).digest('hex').slice(0,40);
 const value={provider:'asterisk',endpointId:endpoint,sipUsername:endpoint,sipPassword:'x'.repeat(43),extensionId,extension:'0',sipDomain:'phone.elevateforhumanity.org',wsUrl:'wss://phone.elevateforhumanity.org/ws'};
 verifyCredential(value,identity);
 for(const bad of [{...value,wsUrl:'ws://phone.elevateforhumanity.org/ws'},{...value,sipDomain:'other.example'},{...value,endpointId:'pwa-'+'a'.repeat(40)}])assert.throws(()=>verifyCredential(bad,identity),/DEVICE_UNVERIFIED/);
});
test('ringing, registration and packet counts alone cannot certify two-way operator audio',()=>{
 const call={liveGreetingAcceptance:'FAIL',operatorGreetingAcceptance:'PASS',operatorTransferAcceptance:'PASS'};
 const device={received:true,answered:true,dtlsConnected:true,inboundBytes:5000,outboundBytes:5000,remoteAudibleWindows:10,failed:false};
 assert.equal(operatorAudioPassed(call,device),true);
 for(const change of [{answered:false},{dtlsConnected:false},{remoteAudibleWindows:0},{outboundBytes:0},{failed:true}])assert.equal(operatorAudioPassed(call,{...device,...change}),false);
 assert.equal(operatorAudioPassed({...call,operatorTransferAcceptance:'FAIL'},device),false);
 assert.equal(operatorAudioPassed({...call,operatorGreetingAcceptance:'FAIL'},device),false);
 assert.equal(operatorAudioPassed({liveGreetingAcceptance:'PASS',operatorTransferAcceptance:'PASS'},device),false);
});
test('the guarded acceptance dispatcher must parse as shell before it can start a live test',async()=>{
 const {readFileSync}=await import('node:fs');const {spawnSync}=await import('node:child_process');
 const workflow=readFileSync(new URL('../../.github/workflows/phone-live-acceptance.yml',import.meta.url),'utf8');
 const block=workflow.match(/        run: \|\n([\s\S]*?)\n  acceptance:/)?.[1];
 assert.ok(block);const source=block.split('\n').map(line=>line.replace(/^          /,'')).join('\n');
 const checked=spawnSync('/bin/bash',['-n'],{input:source,encoding:'utf8'});assert.equal(checked.status,0,checked.stderr);
});

test('voicemail acceptance requires a real assigned call, callback, private recording and the synthetic message',()=>{
 const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 const voicemail={id,assigned_profile_id:profileId,extension_id:extensionId,phone_system_id:system.id,phone_number:'+14632401404',recording_url:'supabase://phone-voicemails/'+id+'.wav',transcription:'This is an authorized Elevate phone system test. No callback is needed. Voicemail routing test complete.'};
 const call={id,phone_system_id:system.id,assigned_profile_id:profileId,assigned_extension_id:extensionId,from_number:'+14632401404'};const task={id,assigned_profile_id:profileId,extension_id:extensionId,source:'voicemail',callback_number:'+14632401404'};
 assert.equal(verifyVoicemailEvidence(voicemail,call,task),true);
 for(const change of [{transcription:null},{assigned_profile_id:extensionId},{phone_number:'+15555555555'},{recording_url:'https://public.example/audio.wav'}])assert.equal(verifyVoicemailEvidence({...voicemail,...change},call,task),false);
 assert.equal(verifyVoicemailEvidence(voicemail,{},task),false);assert.equal(verifyVoicemailEvidence(voicemail,call,{}),false);
 assert.equal(verifyVoicemailEvidence(voicemail,{...call,from_number:'+13175550100'},task),false);
 assert.equal(verifyVoicemailEvidence(voicemail,call,{...task,callback_number:'unknown'}),false);
});

test('an owned-number self-call cannot certify preservation of a distinct original caller',()=>{
 const id='test-message',number='+14632401404';
 const evidence=voicemailCallerEvidence(number,{id,phone_number:number},{id,from_number:number},{id,callback_number:number});
 assert.deepEqual(evidence,{linkedCallerFieldsMatch:true,originalCallerIdentityAcceptance:'NOT_VERIFIED',originalCallerIdentityReason:'self_call_uses_business_number'});
});

test('distinct caller evidence rejects business-number substitution in every linked record',()=>{
 const id='test-message',caller='+13175550100',business='+14632401404';
 const voicemail={id,phone_number:caller},call={id,from_number:caller},task={id,callback_number:caller};
 assert.equal(voicemailCallerEvidence(caller,voicemail,call,task).originalCallerIdentityAcceptance,'PASS');
 for(const [v,c,t] of [
  [{...voicemail,phone_number:business},call,task],
  [voicemail,{...call,from_number:business},task],
  [voicemail,call,{...task,callback_number:business}],
  [{...voicemail,phone_number:business},{...call,from_number:business},{...task,callback_number:business}],
  [voicemail,{...call,id:'unrelated'},task],[voicemail,call,{...task,id:'unrelated'}],
 ])assert.equal(voicemailCallerEvidence(caller,v,c,t).originalCallerIdentityAcceptance,'FAIL');
 for(const invalid of [undefined,'unknown','101','+01234567890'])assert.equal(voicemailCallerEvidence(invalid,voicemail,call,task).originalCallerIdentityAcceptance,'FAIL');
});
