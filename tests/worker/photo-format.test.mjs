import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTeachingPhoto,convertPhotoToPng} from '../../lib/ultimate-course-builder/adapters/photo-format.mjs';
test('common photo MIME types and aliases remain renderer-compatible',async()=>{
 for(const [input,expected] of [['IMAGE/JPEG; charset=binary','image/jpeg'],['image/jpg','image/jpeg'],['image/pjpeg','image/jpeg'],['image/x-png','image/png'],['image/webp','image/webp']]){
  const bytes=Buffer.from('image');const result=await normalizeTeachingPhoto(bytes,input);
  assert.equal(result.mimeType,expected);assert.equal(result.bytes,bytes);
 }
});
test('additional raster photo formats normalize to PNG',async()=>{
 for(const type of ['image/gif','image/bmp','image/tiff','image/avif','image/heic','image/heif']){
  let converted=false;
  const result=await normalizeTeachingPhoto(Buffer.from('photo'),type,{convert:async()=>{converted=true;return Buffer.from('png');}});
  assert.equal(converted,true);assert.equal(result.mimeType,'image/png');assert.equal(result.bytes.toString(),'png');
 }
});
test('the actual worker converter decodes a GIF into PNG',async()=>{
 const gif=Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64');
 const result=await convertPhotoToPng(gif);
 assert.equal(result.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
});
test('corrupt or unsupported inputs fail instead of becoming substitute artwork',async()=>{
 await assert.rejects(normalizeTeachingPhoto(Buffer.alloc(0),'image/png'),/SIZE_INVALID/);
 await assert.rejects(normalizeTeachingPhoto(Buffer.from('bad'),'image/svg+xml'),/FORMAT_UNSUPPORTED/);
 await assert.rejects(convertPhotoToPng(Buffer.from('corrupt image')),/FORMAT_DECODE_FAILED/);
});
