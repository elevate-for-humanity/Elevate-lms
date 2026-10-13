import { createHash } from 'node:crypto';
import { OpenAIProvider } from '@/lib/ai/providers/openai';
import { runWithPaidInferenceContext } from '@/lib/ai/paid-inference-context';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Private, reusable photographs tied to exact spoken teaching points.
 * These are illustrations, never evidence of a performed practical skill. */
export async function prepareTeachingPhotos(input: any, db: SupabaseClient) {
  if (input.lessonPresentation !== 'approved-premium-v1') return input;
  const scenes = input.artifacts?.storyboard?.storyboard?.scenes;
  if (!Array.isArray(scenes)) throw new Error('TEACHING_PHOTO_STORYBOARD_REQUIRED');
  const photos: Record<string, any[]> = {};
  const provider = new OpenAIProvider();
  if (!provider.isAvailable()) throw new Error('TEACHING_PHOTO_PROVIDER_NOT_CONFIGURED');
  for (const scene of scenes) {
    const steps = scene.teachingVisual?.steps;
    if (!steps?.length) throw new Error('TEACHING_PHOTO_SCRIPT_CUES_REQUIRED');
    const requests = steps.length === 1 ? [
      {...steps[0], view:'full workstation view'}, {...steps[0], view:'close detail view with complete hands and tools'},
    ] : steps.map((step: any) => ({...step,view:'complete action view'}));
    if(!scene.recapText?.trim()) throw new Error('TEACHING_MOMENT_RECAP_REQUIRED');
    requests.push({label:'Recap',value:scene.recapText,narrationQuote:scene.recapText,view:'fresh summary illustration'});
    photos[scene.id] = [];
    for (const [index, step] of requests.entries()) {
      const prompt = [
        'Photorealistic instructional illustration, not proof of a performed practical procedure.',
        'Show complete hands, tools and relevant subject, uncropped, no printed text, no logos, no invented measurements.',
        'Use a realistic professional training setting. No unsafe actions or invented numbered guards.',
        String(input.courseTitle), String(scene.visualRequirement), String(step.narrationQuote), step.view,
      ].join('\n');
      const requestHash = createHash('sha256').update(JSON.stringify({version:'approved-picture-cues-v1',lesson:input.lessonId,scene:scene.id,index,prompt})).digest('hex');
      const storagePath = 'approved-teaching-photos/'+requestHash+'.png';
      let {data:file} = await db.storage.from('course_videos').download(storagePath);
      if (!file) {
        const generated = await runWithPaidInferenceContext('course-video:'+input.lessonId+':'+requestHash, () =>
          provider.generateImage({prompt,size:'1792x1024',style:'natural',format:'b64_json',count:1}));
        if (!generated[0]?.b64Json) throw new Error('TEACHING_PHOTO_GENERATION_EMPTY');
        const bytes = Buffer.from(generated[0].b64Json,'base64');
        const {error} = await db.storage.from('course_videos').upload(storagePath,bytes,{contentType:'image/png',upsert:false});
        if(error && !/already exists|duplicate/i.test(error.message)) throw error;
        const downloaded=await db.storage.from('course_videos').download(storagePath);
        if(downloaded.error||!downloaded.data) throw new Error('TEACHING_PHOTO_READBACK_FAILED');
        file=downloaded.data;
      }
      const sha256=createHash('sha256').update(Buffer.from(await file.arrayBuffer())).digest('hex');
      const signed=await db.storage.from('course_videos').createSignedUrl(storagePath,3600);
      if(signed.error||!signed.data?.signedUrl) throw new Error('TEACHING_PHOTO_SIGNING_FAILED');
      photos[scene.id].push({imageUrl:signed.data.signedUrl,storagePath,sha256,narrationQuote:step.narrationQuote,stepIndex:steps.indexOf(step)>=0?steps.indexOf(step):Math.min(index,steps.length-1),illustration:true});
    }
    if(new Set(photos[scene.id].map(p=>p.sha256)).size<2) throw new Error('TEACHING_PHOTOS_MUST_BE_DISTINCT');
  }
  return {...input,teachingPhotos:photos};
}
