import test from 'node:test';
import assert from 'node:assert/strict';
import {retireStandaloneTrunk} from './retire-standalone-trunk.mjs';
const account='AC'+'a'.repeat(32),sid='TK'+'b'.repeat(32);
const bindings={TWILIO_ACCOUNT_SID:account,TWILIO_AUTH_TOKEN:'private',TWILIO_PHONE_NUMBER:'+14632401404'};
function fixture({attached=false,active=false,wrongOwner=false,notDeleted=false,absent=false}={}) {
 let deleted=false;const writes=[];
 const trunk={sid,account_sid:wrongOwner?'AC'+'f'.repeat(32):account,domain_name:'elevate-standalone.pstn.twilio.com'};
 return {writes,request:async(url,options={})=>{
  if(options.method==='DELETE'){writes.push(url);deleted=true;return new Response(null,{status:204});}
  if(url.endsWith('/Trunks?PageSize=100'))return Response.json({trunks:absent?[]:[trunk]});
  if(url.includes('/PhoneNumbers?'))return Response.json({phone_numbers:attached?[{sid:'preserve-number'}]:[]});
  if(url.includes('/Calls.json?'))return Response.json({calls:active?[{sid:'active'}]:[],next_page_uri:null});
  return deleted&&!notDeleted?new Response(null,{status:404}):Response.json(trunk);
 }};
}
test('deletes only the owned empty standalone trunk and independently verifies absence',async()=>{
 const f=fixture();assert.deepEqual(await retireStandaloneTrunk(bindings,f.request),{legacyStandaloneAbsent:true,alreadyAbsent:false});assert.deepEqual(f.writes,['https://trunking.twilio.com/v1/Trunks/'+sid]);
});
test('is idempotent once the old trunk is absent',async()=>{
 const f=fixture({absent:true});assert.equal((await retireStandaloneTrunk(bindings,f.request)).alreadyAbsent,true);assert.equal(f.writes.length,0);
});
for(const [option,reason] of [['attached','ATTACHED_NUMBERS'],['active','ACTIVE_CALLS'],['wrongOwner','OWNERSHIP']])test('refuses unsafe deletion: '+option,async()=>{
 const f=fixture({[option]:true});await assert.rejects(retireStandaloneTrunk(bindings,f.request),new RegExp(reason));assert.equal(f.writes.length,0);
});
test('HTTP success from DELETE is not proof that the old trunk is absent',async()=>{
 const f=fixture({notDeleted:true});await assert.rejects(retireStandaloneTrunk(bindings,f.request),/ABSENCE_NOT_CONFIRMED/);
});
