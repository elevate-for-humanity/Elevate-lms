import test from 'node:test';
import assert from 'node:assert/strict';
import {connectTwilioParis} from './connect-twilio-paris.mjs';
const account='AC'+'a'.repeat(32),pn='PN'+'b'.repeat(32),tk='TK'+'c'.repeat(32),ou='OU'+'d'.repeat(32);
const bindings={TWILIO_ACCOUNT_SID:account,TWILIO_AUTH_TOKEN:'private',TWILIO_PHONE_NUMBER:'+14632401404'};
function fixture({readbackFailure=false,otherNumber=false,broadAcl=false,aclReadbackFailure=false,missingAcl=false}={}) {
 const number={sid:pn,account_sid:account,phone_number:bindings.TWILIO_PHONE_NUMBER,trunk_sid:null,voice_application_sid:null,voice_url:'https://demo.example/answer',voice_method:'POST'};
 const changes=[];let linked=false,failed=false;
 const al='AL'+'f'.repeat(32);let aclReads=0;let aclExists=!missingAcl,addressExists=!missingAcl,aclLinked=!missingAcl;const authChanges=[];
 const address={account_sid:account,ip_access_control_list_sid:al,ip_address:'107.178.216.162',cidr_prefix_length:broadAcl?24:32};
 const request=async(url,options)=>{
  const values=options.body?Object.fromEntries(new URLSearchParams(options.body)):null;
  if(url.includes('/SIP/IpAccessControlLists.json?'))return Response.json({ip_access_control_lists:aclExists?[{sid:al,account_sid:account,friendly_name:'Elevate PBX 4632401404 only'}]:[],next_page_uri:null});
  if(url.endsWith('/SIP/IpAccessControlLists.json')&&values){aclExists=true;authChanges.push(values);return Response.json({sid:al,account_sid:account,friendly_name:values.FriendlyName});}
  if(url.includes('/IpAddresses.json?'))return Response.json({ip_addresses:addressExists?[address]:[],next_page_uri:null});
  if(url.endsWith('/IpAddresses.json')&&values){addressExists=true;authChanges.push(values);return Response.json(address);}
  if(url.endsWith('/CredentialLists?PageSize=100'))return Response.json({credential_lists:[]});
  if(url.endsWith('/IpAccessControlLists')&&values){aclLinked=true;authChanges.push(values);return Response.json({sid:al,account_sid:account});}
  if(url.endsWith('/IpAccessControlLists?PageSize=100')) {
   aclReads++;return Response.json({ip_access_control_lists:!aclLinked||aclReadbackFailure&&aclReads>1?[]:[{sid:al,account_sid:account}]});
  }
  if(url.includes('/IncomingPhoneNumbers.json'))return Response.json({incoming_phone_numbers:[{...number}]});
  if(url.includes('/IncomingPhoneNumbers/'+pn)) {
   if(values){changes.push(values);number.trunk_sid=values.TrunkSid||null;linked=Boolean(number.trunk_sid);if('VoiceUrl' in values)number.voice_url=values.VoiceUrl;return Response.json({...number});}
   if(linked&&readbackFailure&&!failed){failed=true;return Response.json({...number,trunk_sid:null});}
   return Response.json({...number});
  }
  if(url.endsWith('/Trunks?PageSize=100'))return Response.json({trunks:[{sid:tk,account_sid:account,domain_name:'elevate-4632401404.pstn.twilio.com',secure:true}]});
  if(url.endsWith('/PhoneNumbers?PageSize=100'))return Response.json({phone_numbers:otherNumber?[{sid:'PN'+'e'.repeat(32)}]:[]});
  if(url.endsWith('/OriginationUrls?PageSize=100'))return Response.json({origination_urls:[{sid:ou,sip_url:'sip:phone.elevateforhumanity.org:5061;transport=tls',enabled:true}]});
  throw Error('Unexpected URL');
 };
 return {request,changes,number,authChanges};
}
test('binds only the verified active DID to the owned secure PBX trunk',async()=>{
 const f=fixture();assert.equal((await connectTwilioParis(bindings,f.request)).ownedPbxDestinationVerified,true);assert.deepEqual(f.changes,[{TrunkSid:tk}]);
});
test('rejects shared trunks before modifying the active number',async()=>{
 const f=fixture({otherNumber:true});await assert.rejects(connectTwilioParis(bindings,f.request),/SHARED_TRUNK/);assert.deepEqual(f.changes,[]);
});
test('restores and verifies the prior number routing when cutover readback fails',async()=>{
 const f=fixture({readbackFailure:true});await assert.rejects(connectTwilioParis(bindings,f.request),/NUMBER_ROUTE_NOT_CONFIRMED/);assert.equal(f.number.trunk_sid,null);assert.equal(f.number.voice_url,'https://demo.example/answer');assert.equal(f.changes.length,2);
});
test('refuses a different number without provider requests',async()=>{
 await assert.rejects(connectTwilioParis({...bindings,TWILIO_PHONE_NUMBER:'+13179999620'},async()=>assert.fail()),/IDENTITY/);
});

test('rejects an overly broad PBX ACL before moving the active number',async()=>{
 const f=fixture({broadAcl:true});await assert.rejects(connectTwilioParis(bindings,f.request),/ACL_SOURCE_REQUIRES_REVIEW/);assert.deepEqual(f.changes,[]);
});
test('requires independent outbound authorization readback before moving the number',async()=>{
 const f=fixture({aclReadbackFailure:true});await assert.rejects(connectTwilioParis(bindings,f.request),/TERMINATION_AUTH_NOT_CONFIRMED/);assert.deepEqual(f.changes,[]);
});

test('creates only a single-address PBX ACL and verifies its trunk attachment',async()=>{
 const f=fixture({missingAcl:true});const result=await connectTwilioParis(bindings,f.request);
 assert.equal(result.terminationPbxIpVerified,true);
 assert.deepEqual(f.authChanges,[{FriendlyName:'Elevate PBX 4632401404 only'},
 {FriendlyName:'Owned Google PBX only',IpAddress:'107.178.216.162',CidrPrefixLength:'32'},
 {IpAccessControlListSid:'AL'+'f'.repeat(32)}]);
});
