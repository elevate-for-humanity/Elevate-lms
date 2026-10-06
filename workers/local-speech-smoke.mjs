import { KokoroTTS } from 'kokoro-js';
import { transcribeLocalAudio } from '../lib/video/local-transcription.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const execute=promisify(execFile);
const sentence="Before cutting hair, wash your hands and clean the tools. Check the client's scalp and explain the next step.";
const text=sentence+" Place a clean cape around the shoulders and adjust the chair. Choose the correct guard before starting the first section. Keep the clipper moving with steady pressure. Stop immediately if the skin becomes irritated. After the haircut, brush away loose hair, show the finished shape in a mirror, and disinfect every reusable tool."
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
  const actual=tokens(result.text);
  const expected=tokens(text);
  // Ordered word coverage must detect omissions and repeated-phrase collapse.
  const row=Array(actual.length+1).fill(0);
  for(const word of expected) {
    let diagonal=0;
    for(let j=1;j<=actual.length;j++) {
      const previous=row[j];
      row[j]=word===actual[j-1] ? diagonal+1 : Math.max(row[j],row[j-1]);
      diagonal=previous;
    }
  }
  const coverage=row[actual.length]/expected.length;
  const durationSeconds=samples.length/audio.sampling_rate;
  const ordered=result.words.every((word,index)=>index===0 || word.start>=result.words[index-1].start);
  const lastEnd=result.words.at(-1)?.end;
  if(!ordered || lastEnd>durationSeconds+0.5 || lastEnd<durationSeconds*0.8) throw new Error('SMOKE_CAPTION_TIMELINE_INVALID');
  if(coverage<0.9 || result.words.length<10) throw new Error('SMOKE_DECODED_SPEECH_OR_TIMINGS_FAILED');
  console.log(JSON.stringify({provider:result.provider,model:result.model,wordCount:result.words.length,coverage}));
} catch(error) {
  // Emscripten installs an uncaught-error handler that otherwise prints its entire
  // single-line module and hides the actual failure in Docker log truncation.
  console.error(`COURSE_SPEECH_SMOKE_FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode=1;
} finally { await rm(directory,{recursive:true,force:true}); }
