import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

export function recognizedWords(result) {
  if (!result || typeof result.text !== 'string' || !result.text.trim()) throw new Error('LOCAL_TRANSCRIPTION_EMPTY');
  if (!Array.isArray(result.chunks) || !result.chunks.length) throw new Error('LOCAL_TRANSCRIPTION_WORD_TIMINGS_REQUIRED');
  return result.chunks.map((chunk, index) => {
    const [start,end]=Array.isArray(chunk.timestamp) ? chunk.timestamp : [];
    if (typeof chunk.text !== 'string' || !chunk.text.trim() || !Number.isFinite(start) || !Number.isFinite(end) || start<0 || end<=start)
      throw new Error(`LOCAL_TRANSCRIPTION_WORD_TIMINGS_REQUIRED:${JSON.stringify({index,start,end,wordLength:typeof chunk.text === 'string' ? chunk.text.trim().length : 0,chunkCount:result.chunks.length})}`);
    return {word:chunk.text.trim(),start,end};
  });
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
    const transcriber=await loadLocalTranscriber();
    const result=await transcriber(decodeFloatPcm(stdout), {language:'english',task:'transcribe',return_timestamps:'word',chunk_length_s:20,stride_length_s:3});
    return {text:result.text.trim(),words:recognizedWords(result),provider:'local_whisper',model:LOCAL_TRANSCRIPTION_MODEL};
  } finally { await rm(directory,{recursive:true,force:true}); }
}
