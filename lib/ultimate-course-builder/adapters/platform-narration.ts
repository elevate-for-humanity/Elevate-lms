import { measureNarrationCaptions } from '@/lib/video/media-quality-gate';
import type { UltimateNarrationPort } from '../core/ports';
import { configuredNarrationProvider, generateEdgeTTS } from '@/lib/video/edge-tts';
import { uploadLessonMediaBuffer } from '@/lib/video/upload-lesson-media';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const execute=promisify(execFile);
export class UltimatePlatformNarration implements UltimateNarrationPort {
 async generate(input:any){
  const approved=input.artifacts?.instructor_script?.script?.segments;
  if(!approved?.length||!input.lessonId)throw Error('ULTIMATE_APPROVED_NARRATION_SEGMENTS_REQUIRED');
  const directory=await mkdtemp(join(tmpdir(),'ultimate-narration-'));
  try{
   const segments=[];
   for(const [index,segment] of approved.entries()){
    const parts=[],captions:any[]=[];
    let cursor=0;
    const recordings=segment.narrationParts??[{text:segment.text,isRecap:false}];
    const files=[];
    for(const [partIndex,recording] of recordings.entries()){
     if(!recording.text?.trim())throw Error('BLANK_NARRATION_PART_PROHIBITED');
     const audio=await generateEdgeTTS(recording.text);
     const source=join(directory,index+'-'+partIndex+'.mp3'),pcm=join(directory,index+'-'+partIndex+'.wav');
     await writeFile(source,audio);
     await execute('ffmpeg',['-v','error','-y','-i',source,'-ac','1','-ar','16000','-c:a','pcm_s16le',pcm]);
     const {stdout}=await execute('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',pcm]);
     const durationSeconds=Number(stdout.trim());
     if(!(durationSeconds>0))throw Error('ULTIMATE_NARRATION_DURATION_REQUIRED');
     const bytes=await readFile(pcm);
     const measured=await measureNarrationCaptions(bytes,recording.text,durationSeconds);
     captions.push(...measured.map((c:any)=>({...c,startSeconds:cursor+c.startSeconds,endSeconds:cursor+c.endSeconds})));
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
    segments.push({segmentId:segment.id,text:parts.map(p=>p.text).join('\n\n'),audioUrl,durationSeconds:cursor,captions,parts});
   }
   return {provider:configuredNarrationProvider(),segments,transcript:segments.map(s=>s.text).join('\n\n'),durationSeconds:segments.reduce((sum,s)=>sum+s.durationSeconds,0)};
  }finally{await rm(directory,{recursive:true,force:true});}
 }
}
