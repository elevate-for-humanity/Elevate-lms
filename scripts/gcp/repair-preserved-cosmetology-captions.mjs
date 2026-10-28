import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const run=promisify(execFile);
export function measuredCaptions(words,duration){
 if(!Array.isArray(words)||!words.length||!Number.isFinite(duration)||duration<=0)throw Error('MEASURED_WORDS_REQUIRED');
 let prior=-1;const cues=[];let group=[];
 const flush=()=>{if(group.length){cues.push({start:group[0].start,end:group.at(-1).end,text:group.map(w=>w.word).join(' ')});group=[];}};
 for(const w of words){
  if(typeof w.word!=='string'||!w.word.trim()||/[<>{}\\\r\n]/.test(w.word)||!Number.isFinite(w.start)||!Number.isFinite(w.end)||w.start<prior||w.end<=w.start||w.start<0||w.end>duration)throw Error('INVALID_MEASURED_WORD');
  if(group.length&&(group.length>=6||w.end-group[0].start>2.5||group.map(x=>x.word).join(' ').length+w.word.length>52))flush();
  group.push(w);prior=w.start;
 }
 flush();
 for(let i=1;i<cues.length;i++)if(cues[i].start<cues[i-1].end)throw Error('OVERLAPPING_CAPTION_MEASUREMENTS');
 return cues;
}
const stamp=s=>{const ms=Math.round(s*1000);return [Math.floor(ms/3600000),Math.floor(ms/60000)%60,Math.floor(ms/1000)%60].map(x=>String(x).padStart(2,'0')).join(':')+','+String(ms%1000).padStart(3,'0');};
export function toSrt(cues){return cues.map((c,i)=>(i+1)+'\n'+stamp(c.start)+' --> '+stamp(c.end)+'\n'+c.text+'\n').join('\n');}
async function audioSha(file){const r=await run('ffmpeg',['-hide_banner','-loglevel','error','-i',file,'-map','0:a:0','-c:a','copy','-f','adts','pipe:1'],{encoding:'buffer',timeout:120000,maxBuffer:32*1024*1024});return createHash('sha256').update(r.stdout).digest('hex');}
const assTime=s=>{const cs=Math.round(s*100);return Math.floor(cs/360000)+':'+String(Math.floor(cs/6000)%60).padStart(2,'0')+':'+String(Math.floor(cs/100)%60).padStart(2,'0')+'.'+String(cs%100).padStart(2,'0');};
export function toAss(cues){return '[Script Info]\nScriptType: v4.00+\nPlayResX: 1280\nPlayResY: 720\nWrapStyle: 2\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,DejaVu Sans,28,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,3,1,0,2,24,24,18,1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n'+cues.map(c=>'Dialogue: 0,'+assTime(c.start)+','+assTime(c.end)+',Default,,0,0,0,,'+c.text).join('\n')+'\n';}
export async function main(){
 const dir=resolve(process.env.AUDIT_OUTPUT_DIR||'preserved-media-audit');
 const evidence=JSON.parse(await readFile(dir+'/evidence.json','utf8'));
 const speech=JSON.parse(await readFile(dir+'/narration-evidence.json','utf8'));
 const source=dir+'/preserved-checkpoint.mp4',output=dir+'/caption-repair-candidate.mp4';
 const hash=createHash('sha256').update(await readFile(source)).digest('hex');
 if(hash!==evidence.mediaSha256||hash!==speech.mediaSha256)throw Error('SAME_MEASURED_MEDIA_REQUIRED');
 const cues=measuredCaptions(speech.words,evidence.durationSeconds);
 await writeFile(dir+'/measured-captions.srt',toSrt(cues));
 await writeFile(dir+'/measured-captions.ass',toAss(cues));
 await run('ffmpeg',['-hide_banner','-loglevel','error','-i',source,'-vf',"drawbox=x=0:y=634:w=iw:h=86:color=0x131c21:t=fill,ass=measured-captions.ass",'-map','0:v:0','-map','0:a:0','-c:v','libx264','-preset','fast','-crf','18','-c:a','copy','-movflags','+faststart','-y','caption-repair-candidate.mp4'],{cwd:dir,timeout:300000,maxBuffer:2*1024*1024});
 const originalAudioSha=await audioSha(source),candidateAudioSha=await audioSha(output);
 if(originalAudioSha!==candidateAudioSha)throw Error('ORIGINAL_NARRATION_CHANGED');
 const measured=await run('ffmpeg',['-hide_banner','-i',output,'-vf','freezedetect=n=-50dB:d=4,blackdetect=d=0.5:pix_th=0.10','-af','silencedetect=noise=-40dB:d=1','-f','null','-'],{timeout:120000,maxBuffer:4*1024*1024});
 const events=measured.stderr.split('\n').filter(l=>/freeze_start|freeze_duration|freeze_end|black_start|silence_start|silence_end/.test(l));
 await run('ffmpeg',['-hide_banner','-loglevel','error','-ss','249','-i',output,'-frames:v','1','-y',dir+'/caption-repair-sample.png'],{timeout:30000});
 const report={sourceMediaSha256:hash,candidateMediaSha256:createHash('sha256').update(await readFile(output)).digest('hex'),originalAudioSha,candidateAudioSha,identicalNarrationBytes:true,measuredCaptionCount:cues.length,measuredEvents:events,sourceVisualSequencePreserved:true,scope:'caption-layer-only',independentQaPassed:false,canonicalPublicationChanged:false,databaseMutations:0};
 await writeFile(dir+'/caption-repair-evidence.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
