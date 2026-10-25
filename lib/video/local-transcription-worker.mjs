import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {decodeFloatPcm,recognizedWords,LOCAL_TRANSCRIPTION_MODEL} from './local-transcription.mjs';

let modelPromise;

export async function loadLocalTranscriber() {
  if (!modelPromise) {
    const packageName = '@huggingface/transformers';
    modelPromise = import(packageName)
      .then(({pipeline}) =>
        pipeline('automatic-speech-recognition', LOCAL_TRANSCRIPTION_MODEL, {device:'cpu',dtype:'q8'}))
      .catch((error) => {
        // Do not permanently cache a failed model download or initialization.
        // A later bounded transcription attempt must be able to initialize anew.
        modelPromise = undefined;
        throw error;
      });
  }
  return modelPromise;
}

// A full 30-second Whisper window can yield invalid word alignment. Use a
// shorter retry window, then a window without overlap, and re-decode the
// same PCM; never repair evidence by
// inventing timestamps, dropping decoded words, or removing validation.
export async function transcribeDecodedAudio(samples, transcriber, {wordTimings=true}={}) {
  if(!wordTimings) {
    const result=await transcriber(samples,{language:'english',task:'transcribe',return_timestamps:false,chunk_length_s:20,stride_length_s:3});
    if(typeof result.text!=='string'||!result.text.trim())throw Error('LOCAL_TRANSCRIPTION_EMPTY');
    return {text:result.text.trim(),provider:'local_whisper',model:LOCAL_TRANSCRIPTION_MODEL};
  }
  const duration = samples.length / 16000;
  // Two windows longer than a short clip produce the same single chunk.
  // Re-segment short recordings on retry so the alignment actually changes.
  const retryWindow = duration >= 3 && duration <= 20 ? duration * 0.65 : 29;
  const profiles=[{chunk_length_s:20,stride_length_s:3},{chunk_length_s:retryWindow,stride_length_s:retryWindow === 29 ? 5 : retryWindow/6},{chunk_length_s:retryWindow,stride_length_s:0}];
  for(let attempt=0;attempt<profiles.length;attempt++) {
    const result=await transcriber(samples,{language:'english',task:'transcribe',return_timestamps:'word',...profiles[attempt]});
    try {
      return {text:result.text.trim(),words:recognizedWords(result,samples.length/16000),provider:'local_whisper',model:LOCAL_TRANSCRIPTION_MODEL};
    } catch(error) {
      if(attempt===profiles.length-1 || !String(error?.message).startsWith('LOCAL_TRANSCRIPTION_WORD_TIMINGS_REQUIRED')) throw error;
    }
  }
}
async function main() {
  try {
    const samples=decodeFloatPcm(await readFile(process.argv[2]));
    const transcriber=await loadLocalTranscriber();
    process.stdout.write(JSON.stringify(await transcribeDecodedAudio(samples,transcriber,{wordTimings:!process.argv.includes('--text-only')}))+'\n');
  } catch(error) {
    console.error('LOCAL_TRANSCRIPTION_FAILED: '+(error instanceof Error ? error.message : String(error)));
    process.exitCode=1;
  }
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) await main();
