import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareCourseVideoDownload, hasActiveMediaTransfer } from './course-video-download.mjs';
const execute = promisify(execFile);

test('protects an active transfer from idle session cleanup, with a finite deadline',()=>{
  const start=Date.parse('2026-10-02T23:00:00Z');
  const downloading=new Map([['clip',{status:'downloading',createdAt:new Date(start).toISOString()}]]);
  assert.equal(hasActiveMediaTransfer(downloading,start+20*60000),true);
  assert.equal(hasActiveMediaTransfer(downloading,start+61*60000),false);
  downloading.get('clip').status='normalizing';
  assert.equal(hasActiveMediaTransfer(downloading,start+20*60000),true);
  downloading.get('clip').status='ready';
  assert.equal(hasActiveMediaTransfer(downloading,start+20*60000),false);
});

test('prepares an actual ProRes file without cropping, repeating, or shortening it',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'studio-prores-'));
  try {
    const filePath=join(directory,'licensed.mov');
    await execute('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i',
      'testsrc2=size=640x360:rate=24','-t','1.5','-c:v','prores_ks',filePath]);
    const item={id:'test',filePath,fileName:'licensed.mov',contentType:'video/quicktime'};
    const result=await prepareCourseVideoDownload(item);
    assert.equal(result.codec,'h264');
    assert.equal(result.contentType,'video/mp4');
    assert.ok(Math.abs(result.durationSeconds-1.5)<0.05);
    assert.equal(result.sourceVideo.codec,'prores');
    assert.equal(result.sourceVideo.fileName,'licensed.mov');
    assert.ok((await stat(result.filePath)).size>0);
    assert.equal(Number(result.resolution.split('x')[0])/Number(result.resolution.split('x')[1]),16/9);
  } finally {await rm(directory,{recursive:true,force:true});}
});

test('rejects a corrupt video and preserves the original for diagnosis',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'studio-corrupt-'));
  try {
    const filePath=join(directory,'broken.mov');
    await writeFile(filePath,'not video');
    await assert.rejects(()=>prepareCourseVideoDownload({id:'test',filePath,fileName:'broken.mov'}));
    assert.equal((await stat(filePath)).size,9);
  } finally {await rm(directory,{recursive:true,force:true});}
});

test('keeps licensed image downloads intact',async()=>{
  const item={fileName:'photo.jpg',filePath:'/not-read'};
  assert.equal(await prepareCourseVideoDownload(item),item);
});
