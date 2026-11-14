import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {inspectCourseMedia} from './inspect-course-media.mjs';
const run=promisify(execFile);
test('actual media integrity distinguishes playable, silent and truncated candidates',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'recovery-test-'));
  try {
    const video=join(dir,'fixture.mp4');
    await run('ffmpeg',['-y','-v','error','-f','lavfi','-i','testsrc2=size=160x90:rate=10','-f','lavfi','-i','sine=frequency=440:sample_rate=16000','-t','1','-c:v','libx264','-threads','1','-c:a','aac',video]);
    const good=await inspectCourseMedia(video);
    assert.equal(good.decodePassed,true);
    assert.equal(good.mediaAcceptanceVerified,false);
    assert.ok(good.durationSeconds>0);
    const silent=join(dir,'no-audio.mp4');
    await run('ffmpeg',['-y','-v','error','-i',video,'-an','-c:v','copy',silent]);
    assert.equal((await inspectCourseMedia(silent)).decodePassed,false);
    const broken=join(dir,'truncated.mp4');
    await writeFile(broken,(await readFile(video)).subarray(0,128));
    await assert.rejects(inspectCourseMedia(broken));
  } finally {await rm(dir,{recursive:true,force:true});}
});
