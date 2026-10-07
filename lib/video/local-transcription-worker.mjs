import {readFile} from 'node:fs/promises';
import {decodeFloatPcm,loadLocalTranscriber,recognizedWords,LOCAL_TRANSCRIPTION_MODEL} from './local-transcription.mjs';
try {
  const samples=decodeFloatPcm(await readFile(process.argv[2]));
  const transcriber=await loadLocalTranscriber();
  const result=await transcriber(samples,{language:'english',task:'transcribe',return_timestamps:'word',chunk_length_s:20,stride_length_s:3});
  console.log(JSON.stringify({text:result.text.trim(),words:recognizedWords(result),provider:'local_whisper',model:LOCAL_TRANSCRIPTION_MODEL}));
} catch(error) {
  console.error(`LOCAL_TRANSCRIPTION_FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode=1;
}
