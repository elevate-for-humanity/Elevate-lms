import { KokoroTTS } from 'kokoro-js';
import { transcribeLocalAudio } from '../lib/video/local-transcription.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const execute=promisify(execFile);
const text="Before cutting hair, wash your hands and clean the tools. Check the client's scalp and explain the next step.";
const directory=await mkdtemp(join(tmpdir(),'course-speech-smoke-'));
try {
  const narrator=await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:'q8',device:'cpu'});
  const audio=await narrator.generate(text,{voice:'af_heart',speed:1});
  const samples=audio.audio ?? audio.data;
  if (!samples?.length || audio.sampling_rate!==24000) throw new Error('SMOKE_NARRATION_INVALID');
  const pcm=Buffer.alloc(samples.length*4);
  for(let i=0;i<samples.length;i++) pcm.writeFloatLE(samples[i],i*4);
  const path=join(directory,'voice.f32');
  await writeFile(path,pcm);
  const {stdout}=await execute('ffmpeg',['-hide_banner','-loglevel','error','-f','f32le','-ar','24000','-ac','1','-i',path,'-f','mp3','pipe:1'],{encoding:'buffer',timeout:60000,maxBuffer:8*1024*1024});
  const result=await transcribeLocalAudio(stdout);
  const tokens=value=>value.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/);
  const actual=new Set(tokens(result.text));
  const expected=tokens(text);
  const coverage=expected.filter(word=>actual.has(word)).length/expected.length;
  if(coverage<0.9 || result.words.length<10) throw new Error('SMOKE_DECODED_SPEECH_OR_TIMINGS_FAILED');
  console.log(JSON.stringify({provider:result.provider,model:result.model,wordCount:result.words.length,coverage}));
} finally { await rm(directory,{recursive:true,force:true}); }
