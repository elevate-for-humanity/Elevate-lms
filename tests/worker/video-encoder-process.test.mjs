import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const cwd=new URL('../../',import.meta.url);
test('real encoder probe success selects GPU; failure selects CPU; explicit CPU skips probe',t=>{
 const dir=mkdtempSync(join(tmpdir(),'elevate-encoder-test-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const run=(preference,exit)=>{
 writeFileSync(join(dir,'ffmpeg'),'#!/bin/sh\nexit '+exit+'\n',{mode:0o700});
 return JSON.parse(execFileSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',"import {videoEncoderArgs} from './lib/video/ffmpeg-runtime.ts'; console.log(JSON.stringify(videoEncoderArgs(20)));"],{cwd,env:{...process.env,PATH:dir,VIDEO_ENCODER:preference},encoding:'utf8'}));
 };
 assert.deepEqual(run('auto',0),['-c:v','h264_nvenc','-preset','p4','-tune','hq','-rc','vbr','-cq','20']);
 assert.deepEqual(run('auto',1),['-c:v','libx264','-preset','fast','-crf','20']);
 assert.deepEqual(run('cpu',0),['-c:v','libx264','-preset','fast','-crf','20']);
});
