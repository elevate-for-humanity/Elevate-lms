import { alignRecordedNarration } from '@/lib/video/forced-alignment.mjs';
import { measureNarrationCaptions } from '@/lib/video/media-quality-gate';
import type { UltimateNarrationPort } from '../core/ports';
import { configuredNarrationProvider, EDGE_TTS_VOICES, generateEdgeTTS } from '@/lib/video/edge-tts';
import { uploadLessonMediaBuffer } from '@/lib/video/upload-lesson-media';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { reportCourseProgress } from '../worker/progress-watch.mjs';
const execute=promisify(execFile);
export class UltimatePlatformNarration implements UltimateNarrationPort {
 async generate(input:any){
  const approved=input.artifacts?.instructor_script?.script?.segments;
  if(!approved?.length||!input.lessonId)throw Error('ULTIMATE_APPROVED_NARRATION_SEGMENTS_REQUIRED');
  const directory=await mkdtemp(join(tmpdir(),'ultimate-narration-'));
  try{
   const segments=[];
   for(const [index,segment] of approved.entries()){
    reportCourseProgress('narration:segment',index,approved.length);
    const parts=[],captions:any[]=[],wordAlignment:any[]=[];
    let cursor=0;
    const recordings=segment.narrationParts??[{text:segment.text,isRecap:false}];
    const files=[];
    for(const [partIndex,recording] of recordings.entries()){
     if(!recording.text?.trim())throw Error('BLANK_NARRATION_PART_PROHIBITED');
     const audio=await generateEdgeTTS(recording.text,{voice:EDGE_TTS_VOICES.warm,rate:'0%'});
     reportCourseProgress('narration:recording:'+index,partIndex+1,recordings.length);
     const source=join(directory,index+'-'+partIndex+'.mp3'),pcm=join(directory,index+'-'+partIndex+'.wav');
     await writeFile(source,audio);
     await execute('ffmpeg',['-v','error','-y','-i',source,'-ac','1','-ar','24000','-c:a','pcm_s16le',pcm]);
     const {stdout}=await execute('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',pcm]);
     const durationSeconds=Number(stdout.trim());
     if(!(durationSeconds>0))throw Error('ULTIMATE_NARRATION_DURATION_REQUIRED');
     // Keep full-band 24 kHz delivery separate from the recognizer input.
     const recognition=join(directory,index+'-'+partIndex+'-recognition.wav');
     await execute('ffmpeg',['-v','error','-y','-i',pcm,'-ar','16000','-c:a','pcm_s16le',recognition]);
     const bytes=await readFile(recognition);
     // Numeral scripts retain the existing measured recognizer until their intended
     // pronunciation is explicitly supplied. Never guess guard lengths.
     let measured;
     const recognize=()=>measureNarrationCaptions(bytes,recording.text,durationSeconds,words=>wordAlignment.push(...words.map(w=>({...w,start:cursor+w.start,end:cursor+w.end}))));
     if (/\d/.test(recording.text)) {
      measured=await recognize();
     } else {
      let words;
      try {words=await alignRecordedNarration(pcm,recording.text);}
      catch(error) {
       // A finite grammar can have no path, or omit a requested word,
       // even when the recording is valid. Both failures need a separate
       // measurement; a mismatched forced alignment is never accepted.
       // Independently measure that same PCM with the existing recognizer;
       // never interpolate timestamps or hide a failed measurement.
       const detail=error instanceof Error?error.message+' '+String((error as any).stderr??''):String(error);
       if(!/FORCED_ALIGNMENT_(?:NO_PATH|SCRIPT_MISMATCH)/.test(detail))throw error;
       measured=await recognize();
      }
      if(words) {
       wordAlignment.push(...words.map((w:any)=>({...w,start:cursor+w.start,end:cursor+w.end})));
       measured=[];
       for(let i=0;i<words.length;i+=8) {
        const group=words.slice(i,i+8);
        measured.push({text:group.map((w:any)=>w.word).join(' '),startSeconds:group[0].start,endSeconds:group.at(-1).end});
       }
      }
     }
     captions.push(...measured.map((c:any)=>({...c,startSeconds:cursor+c.startSeconds,endSeconds:cursor+c.endSeconds})));
     reportCourseProgress('narration:alignment:'+index,partIndex+1,recordings.length);
     const encoded=join(directory,index+'-'+partIndex+'-delivery.mp3');
     await execute('ffmpeg',['-v','error','-y','-i',pcm,'-c:a','libmp3lame','-b:a','128k',encoded]);
     const audioUrl=await uploadLessonMediaBuffer(await readFile(encoded),input.lessonId+'-'+index+'-'+partIndex,'mp3');
     parts.push({text:recording.text,isRecap:recording.isRecap===true,startSeconds:cursor,durationSeconds,audioUrl});
     files.push(pcm);cursor+=durationSeconds;
    }
    const list=join(directory,index+'-concat.txt'),master=join(directory,index+'-master.wav');
    await writeFile(list,files.map(file=>"file '"+file.replace(/'/g,"'\\''")+"'").join('\n'));
    await execute('ffmpeg',['-v','error','-y','-f','concat','-safe','0','-i',list,'-c:a','pcm_s16le',master]);
    const delivery=join(directory,index+'-master.mp3');
    await execute('ffmpeg',['-v','error','-y','-i',master,'-c:a','libmp3lame','-b:a','128k',delivery]);
    const audioUrl=await uploadLessonMediaBuffer(await readFile(delivery),input.lessonId+'-'+segment.id.replace(/[^a-zA-Z0-9-]/g,'-'),'mp3');
    segments.push({segmentId:segment.id,text:parts.map(p=>p.text).join('\n\n'),audioUrl,durationSeconds:cursor,captions,wordAlignment,parts});
    reportCourseProgress('narration:stored-segments',index+1,approved.length);
   }
   return {provider:configuredNarrationProvider(),voice:EDGE_TTS_VOICES.warm,rate:'0%',deliverySampleRate:24000,segments,transcript:segments.map(s=>s.text).join('\n\n'),durationSeconds:segments.reduce((sum,s)=>sum+s.durationSeconds,0)};
  }finally{await rm(directory,{recursive:true,force:true});}
 }
}
