import {createHash} from 'node:crypto';

const pending = new Map();
export function speechCacheKey(text, voice) {
  if(typeof text!=='string'||!text.trim()||typeof voice!=='string'||!voice)throw Error('SPEECH_CACHE_INPUT_INVALID');
  return 'google-neural2-v1/'+createHash('sha256').update(JSON.stringify({text,voice,language:'en-US',encoding:'MP3',speakingRate:1})).digest('hex')+'.mp3';
}
function audioBytes(value) {
  const bytes=Buffer.from(value);
  if(bytes.length<100||bytes.length>8*1024*1024||!(bytes.subarray(0,3).toString()==='ID3'||(bytes[0]===255&&(bytes[1]&224)===224)))throw Error('SPEECH_CACHE_AUDIO_INVALID');
  return bytes;
}
/** Storage must be private and available before incurring a new synthesis charge.
 * Per-process single-flight coalesces concurrent callers; the object persists
 * across instance restarts. No narration text is placed in an object name. */
export async function savedSpeech({text,voice,read,write,synthesize}) {
  const key=speechCacheKey(text,voice);
  if(pending.has(key))return pending.get(key);
  const work=(async()=>{
    const existing=await read(key);
    if(existing)return {audio:audioBytes(existing),cache:'hit'};
    const audio=audioBytes(await synthesize());
    const writeResult=await write(key,audio);
    // Read back durable bytes before claiming reuse is available.
    const stored=audioBytes(await read(key));
    if(!stored.equals(audio)&&writeResult?.existing!==true)throw Error('SPEECH_CACHE_READBACK_MISMATCH');
    return {audio:stored,cache:writeResult?.existing===true?'hit':'stored'};
  })();
  pending.set(key,work);
  try{return await work;}finally{pending.delete(key);}
}
