import {requireAdminClient} from '@/lib/supabase/admin';
import {generateGoogleNaturalVoice} from './google-natural-voice';
import {WEBSITE_SPEAKERS} from '@/lib/website-builder/design-choices';
import {savedSpeech} from './saved-speech.mjs';

export async function generateSavedGoogleSpeech(text: string, speaker='warm') {
  const voice=WEBSITE_SPEAKERS.find(item=>item.id===speaker)?.providerVoice||'en-US-Neural2-F';
  const db=await requireAdminClient();
  const {data: configuration,error: bucketError}=await db.storage.getBucket('speech-cache');
  if(bucketError||!configuration||configuration.public)throw Error('SPEECH_CACHE_PRIVATE_BUCKET_REQUIRED');
  const bucket=db.storage.from('speech-cache');
  return savedSpeech({text,voice,
    read:async(key: string)=>{
      // The download API deliberately does not parse JSON error bodies and can
      // wrap an absent object as StorageUnknownError without its 404 status.
      // Use the JSON metadata endpoint to establish an actual cache miss first.
      const {error: infoError}=await bucket.info(key);
      if(infoError){
        if(String((infoError as {statusCode?: string}).statusCode)==='404')return null;
        throw Error('SPEECH_CACHE_READ_UNAVAILABLE');
      }
      const {data,error}=await bucket.download(key);
      if(error){
        if(String((error as {statusCode?: string}).statusCode)==='404'||error.message==='Object not found')return null;
        throw Error('SPEECH_CACHE_READ_UNAVAILABLE');
      }
      if(!data)throw Error('SPEECH_CACHE_READ_UNAVAILABLE');
      return Buffer.from(await data.arrayBuffer());
    },
    write:async(key: string,audio: Buffer)=>{
      const {error}=await bucket.upload(key,audio,{contentType:'audio/mpeg',upsert:false});
      // Another instance can win the immutable write. Its valid durable audio
      // is reused after readback; Google may produce different MP3 bytes.
      if(error&&String((error as {statusCode?: string}).statusCode)!=='409'&&!/already exists|Duplicate/i.test(error.message))throw Error('SPEECH_CACHE_WRITE_UNAVAILABLE');
      return {existing:Boolean(error)};
    },
    synthesize:async()=>Buffer.from(await generateGoogleNaturalVoice(text,speaker)),
  });
}
