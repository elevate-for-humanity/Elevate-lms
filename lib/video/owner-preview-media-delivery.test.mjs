import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerPreviewMediaDelivery} from './owner-preview-media-delivery.mjs';
const target='a9b85487-5465-4bc0-bed0-9fc3411c4e50';
test('signs only the successfully uploaded preview object with bounded expiry',async()=>{
 const calls=[];const value=await ownerPreviewMediaDelivery({success:true,key:'course-videos/generated-lessons/one.mp4',url:'https://private/one'}, {target,sign:async(...args)=>{calls.push(args);return 'https://b2/one?signature=test';}});
 assert.equal(value.url,'https://b2/one?signature=test');assert.equal(value.key,'course-videos/generated-lessons/one.mp4');assert.deepEqual(calls,[['course-videos/generated-lessons/one.mp4',21600]]);
});
test('ordinary delivery and failed uploads never request preview access',async()=>{
 const sign=()=>assert.fail('must not sign');
 const ordinary={success:true,key:'course-videos/one',url:'https://public/one'};
 assert.equal(await ownerPreviewMediaDelivery(ordinary,{sign}),ordinary);
 const failed={success:false};assert.equal(await ownerPreviewMediaDelivery(failed,{target,sign}),failed);
});
test('rejects unscoped keys and a signer failure rather than returning an inaccessible URL',async()=>{
 await assert.rejects(()=>ownerPreviewMediaDelivery({success:true,key:'private-tax/one'},{target,sign:async()=>null}),/SCOPE_INVALID/);
 await assert.rejects(()=>ownerPreviewMediaDelivery({success:true,key:'course-videos/one'},{target,sign:async()=>null}),/SIGNING_FAILED/);
});
