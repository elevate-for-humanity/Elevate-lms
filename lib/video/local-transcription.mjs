import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const execute = promisify(execFile);
export const LOCAL_TRANSCRIPTION_MODEL = 'onnx-community/whisper-base_timestamped';
let modelPromise;

export async function loadLocalTranscriber() {
  if (!modelPromise) {
    const packageName = '@huggingface/transformers';
    modelPromise = import(packageName).then(({pipeline}) =>
      pipeline('automatic-speech-recognition', LOCAL_TRANSCRIPTION_MODEL, {device:'cpu',dtype:'q8'}));
  }
  return modelPromise;
}

export function decodeFloatPcm(buffer) {
  if (!buffer.length || buffer.length % 4) throw new Error('LOCAL_TRANSCRIPTION_PCM_INVALID');
  const samples = new Float32Array(buffer.length / 4);
  for(let i=0;i<samples.length;i++) {
    samples[i]=buffer.readFloatLE(i*4);
    if (!Number.isFinite(samples[i])) throw new Error('LOCAL_TRANSCRIPTION_PCM_INVALID');
  }
  return samples;
}

export function recognizedWords(result, durationSeconds) {
  if (durationSeconds !== undefined && (!Number.isFinite(durationSeconds) || durationSeconds <= 0))
    throw new Error('LOCAL_TRANSCRIPTION_DURATION_INVALID');
  if (!result || typeof result.text !== 'string' || !result.text.trim()) throw new Error('LOCAL_TRANSCRIPTION_EMPTY');
  if (!Array.isArray(result.chunks) || !result.chunks.length) throw new Error('LOCAL_TRANSCRIPTION_WORD_TIMINGS_REQUIRED');
  const chunks = result.chunks.map((chunk, index) => {
    const [start,rawEnd]=Array.isArray(chunk.timestamp) ? chunk.timestamp : [];
    // ASR chunk boundaries may extend just beyond the decoded audio. Intersect
    // a bounded trailing span with the actual PCM duration; do not invent time
    // for words starting outside the recording or accept large alignment drift.
    if (durationSeconds !== undefined && (start >= durationSeconds || rawEnd > durationSeconds + 0.5))
      throw new Error(`LOCAL_TRANSCRIPTION_WORD_TIMINGS_REQUIRED:outside_audio:${JSON.stringify({index,start,rawEnd,durationSeconds})}`);
    const end=durationSeconds === undefined ? rawEnd : Math.min(rawEnd,durationSeconds);
    if (typeof chunk.text !== 'string' || !chunk.text.trim() || !Number.isFinite(start) || !Number.isFinite(end) || start<0 || end<start)
      throw new Error(`LOCAL_TRANSCRIPTION_WORD_TIMINGS_REQUIRED:${JSON.stringify({index,start,end})}`);
    return {word:chunk.text.trim(),start,end};
  });
  const words=[];
  for (let index=0;index<chunks.length;index++) {
    const chunk=chunks[index];
    if (index>0 && chunk.start<chunks[index-1].start)
      throw new Error('LOCAL_TRANSCRIPTION_WORD_TIMINGS_REQUIRED:non_monotonic');
    if (chunk.end>chunk.start) { words.push(chunk); continue; }
    // Whisper can collapse an individual word onto a measured boundary.
    // Keep that decoded text in a short phrase whose outer bounds come from
    // neighboring measured spans; never invent an individual word duration.
    const previous=words.at(-1);
    const collapsed=[];
    const boundary=chunk.start;
    while (index<chunks.length && chunks[index].start===boundary && chunks[index].end===boundary) {
      collapsed.push(chunks[index].word);index++;
    }
    const next=chunks[index];
    // A collapsed final word has no following span. Keep it with the preceding
    // measured phrase only when both touch the same boundary. Neither bound is
    // extended and the decoded final text is retained.
    if (!next && collapsed.length<=3 && previous?.end===boundary && previous.end-previous.start<=5) {
      previous.word+=' '+collapsed.join(' ');
      continue;
    }
    const start=previous?.end===boundary ? previous.start : boundary;
    if (collapsed.length>3 || !next || next.end<=next.start || next.start<boundary || next.end-start>5)
      throw new Error(`LOCAL_TRANSCRIPTION_WORD_TIMINGS_REQUIRED:${JSON.stringify({index,boundary,collapsed:collapsed.length})}`);
    const text=previous?.end===boundary ? words.pop().word+' '+collapsed.join(' ') : collapsed.join(' ');
    words.push({word:text+' '+next.word,start,end:next.end});
  }
  return words;
}

export async function transcribeLocalAudio(input) {
  const directory=await mkdtemp(join(tmpdir(),'course-asr-'));
  try {
    let source=input;
    if (Buffer.isBuffer(input)) {
      source=join(directory,'narration.mp3');
      await writeFile(source,input);
    }
    const {stdout}=await execute('ffmpeg',['-hide_banner','-loglevel','error','-i',source,'-vn','-ac','1','-ar','16000','-f','f32le','pipe:1'],{encoding:'buffer',timeout:120000,maxBuffer:256*1024*1024});
    const pcmFile=join(directory,'narration.f32');
    await writeFile(pcmFile,stdout);
    // Kokoro and current Whisper require different native ONNX runtimes.
    // Load speech recognition in its own finite process so one shared library
    // cannot replace the other's ABI inside the narration worker.
    const worker=fileURLToPath(new URL('./local-transcription-worker.mjs',import.meta.url));
    const {stdout:recognized}=await execute(process.execPath,[worker,pcmFile],{encoding:'utf8',timeout:600000,maxBuffer:8*1024*1024});
    return JSON.parse(recognized);
  } finally { await rm(directory,{recursive:true,force:true}); }
}
