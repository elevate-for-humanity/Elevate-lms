import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveOwnerPreviewB2} from './resolve-owner-preview-b2.mjs';
const key='00'+'a'.repeat(23);
const environment=()=>({ELEVATE_MEDIA_ACCESS_KEY_ID:key,ELEVATE_MEDIA_SECRET_ACCESS_KEY:'test-key',ELEVATE_MEDIA_ENDPOINT:'https://example.r2.cloudflarestorage.com'});
function authorized(){return {accountId:'test-account',authorizationToken:'test-session',apiInfo:{storageApi:{apiUrl:'https://api004.backblazeb2.com',s3ApiUrl:'https://s3.us-west-004.backblazeb2.com',downloadUrl:'https://f004.backblazeb2.com',allowed:{buckets:[{name:'elevate-course-media'}],capabilities:['listFiles','readFiles','writeFiles','listBuckets'],namePrefix:null}}}};}
const bucket=()=>({buckets:[{bucketName:'elevate-course-media',bucketType:'allPublic'}]});
test('discovers the real B2 region from authorization instead of reusing a Cloudflare endpoint',async()=>{
 const calls=[];
 const result=await resolveOwnerPreviewB2(environment(),async(url,options)=>{calls.push({url,method:options.method??'GET'});return {ok:true,json:async()=>url.includes('authorize_account')?authorized():bucket()};});
 assert.equal(result.environment.ELEVATE_MEDIA_ENDPOINT,'https://s3.us-west-004.backblazeb2.com');
 assert.equal(result.environment.ELEVATE_MEDIA_PUBLIC_URL,'https://f004.backblazeb2.com/file/elevate-course-media');
 assert.equal(calls.length,2);assert.equal(calls[1].url.endsWith('b2_list_buckets'),true);
});
test('an authorization denial stops before any bucket request or configuration write',async()=>{
 let calls=0;
 await assert.rejects(()=>resolveOwnerPreviewB2(environment(),async()=>{calls++;return {ok:false,status:403};}),/AUTH_HTTP_403/);
 assert.equal(calls,1);
});
test('never forwards the returned authorization token to an untrusted endpoint',async()=>{
 let calls=0;
 await assert.rejects(()=>resolveOwnerPreviewB2(environment(),async()=>{calls++;const a=authorized();a.apiInfo.storageApi.apiUrl='https://example.org';return {ok:true,json:async()=>a};}),/ENDPOINT_INVALID/);
 assert.equal(calls,1);
});
test('a private bucket remains private and is reported instead of changing its ACL',async()=>{
 const calls=[];
 await assert.rejects(()=>resolveOwnerPreviewB2(environment(),async(url,options)=>{calls.push(url);const b=bucket();b.buckets[0].bucketType='allPrivate';return {ok:true,json:async()=>url.includes('authorize_account')?authorized():b};}),/EXISTING_PUBLIC_DELIVERY_REQUIRED/);
 assert.equal(calls.length,2);assert.equal(calls.some(x=>x.includes('update_bucket')),false);
});
test('reads both explicitly authorized canonical media keys as one family when the old runtime has no B2 pair',async()=>{
 const env={NEXT_PUBLIC_SUPABASE_URL:'https://cuxzzpsyufcewtmicszk.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-service'};
 const names=[];
 const result=await resolveOwnerPreviewB2(env,async(url,options)=>{
  if(url.includes('get_platform_secret')){const name=JSON.parse(options.body).p_key;names.push(name);return {ok:true,json:async()=>name.endsWith('KEY_ID')?key:'test-key'};}
  if(url.includes('authorize_account'))assert.equal(options.headers.Authorization,'Basic '+Buffer.from(key+':test-key').toString('base64'));
  return {ok:true,json:async()=>url.includes('authorize_account')?authorized():bucket()};
 });
 assert.deepEqual(names,['ELEVATE_MEDIA_ACCESS_KEY_ID','ELEVATE_MEDIA_SECRET_ACCESS_KEY']);
 assert.equal(result.connectionSource,'canonical-platform');
});
