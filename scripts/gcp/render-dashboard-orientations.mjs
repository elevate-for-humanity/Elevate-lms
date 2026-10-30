import {readFile,writeFile,mkdtemp,rm,stat} from 'node:fs/promises';
import {existsSync,createReadStream,createWriteStream} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {pipeline} from 'node:stream/promises';
import {generateEdgeTTS,EDGE_TTS_VOICES} from '../../lib/video/edge-tts.ts';
import {S3Client,PutObjectCommand,HeadObjectCommand,GetObjectCommand} from '@aws-sdk/client-s3';
import {alignRecordedNarration} from '../../lib/video/forced-alignment.mjs';
import {orientationKeyForGuide,orientationCaptionGroups} from '../../lib/orientation/media-contract.mjs';
const run=promisify(execFile);
const guides=JSON.parse(await readFile('/source/lib/orientation/dashboard-orientations.json','utf8'));
const root=await mkdtemp(join(tmpdir(),'dashboard-orientation-'));
const endpoint=process.env.ELEVATE_MEDIA_ENDPOINT, bucket=process.env.ELEVATE_MEDIA_BUCKET;
if(!/^https:\/\/s3\.[a-z0-9-]+\.backblazeb2\.com\/?$/.test(endpoint??'')||!bucket)throw Error('ORIENTATION_B2_CONFIGURATION_REQUIRED');
const client=new S3Client({endpoint,region:process.env.ELEVATE_MEDIA_REGION,forcePathStyle:false,requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED',
 credentials:{accessKeyId:process.env.ELEVATE_MEDIA_ACCESS_KEY_ID,secretAccessKey:process.env.ELEVATE_MEDIA_SECRET_ACCESS_KEY}});
process.env.AI_NARRATION_PROVIDER='kokoro';
const time=value=>{const ms=Math.max(0,Math.round(value*1000));return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`;};
const wrap=(text,width)=>{let line='',lines=[];for(const word of text.split(/\s+/)){if((line+' '+word).trim().length>width&&line){lines.push(line);line='';}line+=(line?' ':'')+word;}if(line)lines.push(line);return lines.join('\n');};
async function present(key){try{await client.send(new HeadObjectCommand({Bucket:bucket,Key:key}));return true;}catch(e){if(e.$metadata?.httpStatusCode===404||e.name==='NotFound')return false;throw Error('ORIENTATION_STORAGE_CHECK_FAILED');}}
async function upload(key,file,type){await client.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:createReadStream(file),ContentLength:(await stat(file)).size,ContentType:type,CacheControl:'private,max-age=3600'}));if(!await present(key))throw Error('ORIENTATION_UPLOAD_READBACK_FAILED');}
try {
 for(const [audience,guide] of Object.entries(guides)) {
  const videoKey=orientationKeyForGuide(audience,'mp4',guide),captionKey=orientationKeyForGuide(audience,'vtt',guide);
  if(await present(videoKey)&&await present(captionKey)){console.log(JSON.stringify({audience,status:'existing_verified'}));continue;}
  const parts=[];let offset=0;const fullCaptions=['WEBVTT\n'];
  for(let i=0;i<guide.slides.length;i++) {
   const slide=guide.slides[i],prefix=join(root,`${audience}-${i}`);
   const segmentKey=videoKey+'.segments/'+i+'.mp4',metaKey=videoKey+'.segments/'+i+'.json';
   if(await present(segmentKey)&&await present(metaKey)){
    const saved=await client.send(new GetObjectCommand({Bucket:bucket,Key:metaKey}));
    const meta=JSON.parse(await saved.Body.transformToString());
    if(!Number.isFinite(meta.duration)||meta.duration<=0||!Array.isArray(meta.captions))throw Error('ORIENTATION_SEGMENT_CHECKPOINT_INVALID');
    const media=await client.send(new GetObjectCommand({Bucket:bucket,Key:segmentKey}));
    const local=prefix+'.mp4';await pipeline(media.Body,createWriteStream(local));
    for(const cue of meta.captions)fullCaptions.push(`${time(offset+cue.start)} --> ${time(offset+cue.end)}\n${cue.text}\n`);
    offset+=meta.duration;parts.push(local);
    console.log(JSON.stringify({audience,slide:i+1,total:guide.slides.length,status:'checkpoint_reused'}));
    continue;
   }
   const audio=await generateEdgeTTS(slide.narration,{voice:EDGE_TTS_VOICES.warm,rate:'0%'});
   if(!audio?.length)throw Error('ORIENTATION_NARRATION_INVALID');
   await writeFile(prefix+'.mp3',audio);
   await run('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',prefix+'.mp3','-ac','1','-ar','24000',prefix+'.wav'],{timeout:60000});
   const measured=await run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',prefix+'.wav'],{timeout:15000});
   const seconds=Number(measured.stdout);
   if(!Number.isFinite(seconds)||seconds<=0)throw Error('ORIENTATION_NARRATION_DURATION_INVALID');
   const volume=await run('ffmpeg',['-hide_banner','-i',prefix+'.wav','-af','volumedetect','-f','null','-'],{timeout:60000});
   const peak=/max_volume:\s*(-?[\d.]+)\s*dB/.exec(volume.stderr);
   if(!peak||Number(peak[1]) < -40)throw Error('ORIENTATION_NARRATION_INAUDIBLE');
   const words=await alignRecordedNarration(prefix+'.wav',slide.narration);
   if(words.length<10||words.at(-1).end<seconds*.75)throw Error('ORIENTATION_CAPTION_ALIGNMENT_FAILED');
   const captions=['WEBVTT\n'],segmentCaptions=[];
   const groups=orientationCaptionGroups(words);
   for(const [groupIndex,group] of groups.entries()){const start=group[0].start,end=Math.min(seconds,groups[groupIndex+1]?.[0].start??seconds,group.at(-1).end+.08),text=group.map(w=>w.word??w.text).join(' ');segmentCaptions.push({start,end,text});captions.push(`${time(start)} --> ${time(end)}\n${text}\n`);fullCaptions.push(`${time(offset+start)} --> ${time(offset+end)}\n${text}\n`);}
   await writeFile(prefix+'.vtt',captions.join('\n'));
   await writeFile(prefix+'-title.txt',wrap(slide.title,28));
   await writeFile(prefix+'-points.txt',slide.points.map((p,n)=>wrap(`${n+1}. ${p}`,33)).join('\n\n'));
   const image=resolve('/source/public'+slide.image);
   if(!existsSync(image))throw Error('ORIENTATION_IMAGE_MISSING');
   const filter=`[0:v]scale=620:430:force_original_aspect_ratio=decrease,pad=620:430:(ow-iw)/2:(oh-ih)/2:color=0x171717,setsar=1,fade=t=in:st=0:d=0.75[photo];color=c=0x171717:s=1280x720:r=24[base];[base][photo]overlay=35:155,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='ELEVATE  |  DASHBOARD ORIENTATION':x=40:y=28:fontsize=17:fontcolor=0xcdb795,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${String(i+1).padStart(2,'0')} / ${guide.slides.length}':x=40:y=85:fontsize=28:fontcolor=0xcdb795,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:textfile=${prefix}-title.txt:expansion=none:x=695:y=95:fontsize=32:fontcolor=white:line_spacing=8,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile=${prefix}-points.txt:expansion=none:x=695:y=260:fontsize=23:fontcolor=0xf5e6cc:line_spacing=7,drawbox=x=0:y=605:w=1280:h=115:color=black:t=fill[out]`;
   const video=prefix+'.mp4';
   await run('ffmpeg',['-y','-hide_banner','-loglevel','error','-loop','1','-framerate','24','-i',image,'-i',prefix+'.wav','-filter_complex',filter,'-map','[out]','-map','1:a:0','-t',String(seconds),'-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-ac','2','-movflags','+faststart',video],{timeout:300000,maxBuffer:2*1024*1024});
   const {stdout}=await run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',video],{timeout:15000});
   if(Math.abs(Number(stdout)-seconds)>.3)throw Error('ORIENTATION_ENCODE_DURATION_MISMATCH');
   const meta=prefix+'.json';await writeFile(meta,JSON.stringify({duration:Number(stdout),captions:segmentCaptions}));
   await upload(segmentKey,video,'video/mp4');await upload(metaKey,meta,'application/json');
   parts.push(video);offset+=Number(stdout);
   console.log(JSON.stringify({audience,slide:i+1,total:guide.slides.length,status:'encoded',seconds:Math.round(seconds)}));
  }
  const list=join(root,audience+'-concat.txt');await writeFile(list,parts.map(p=>`file '${p}'`).join('\n'));
  const final=join(root,audience+'.mp4'),vtt=join(root,audience+'.vtt');
  await run('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',list,'-c','copy','-movflags','+faststart',final],{timeout:120000});
  const probe=await run('ffprobe',['-v','error','-show_entries','stream=codec_type','-show_entries','format=duration','-of','json',final],{timeout:15000});
  const encoded=JSON.parse(probe.stdout);
  if(!encoded.streams.some(s=>s.codec_type==='audio')||!encoded.streams.some(s=>s.codec_type==='video')||Math.abs(Number(encoded.format.duration)-offset)>1)throw Error('ORIENTATION_FINAL_MEDIA_QA_FAILED');
  await writeFile(vtt,fullCaptions.join('\n'));
  await upload(captionKey,vtt,'text/vtt; charset=utf-8');await upload(videoKey,final,'video/mp4');
  console.log(JSON.stringify({audience,status:'published_verified',durationSeconds:Math.round(offset),slides:guide.slides.length}));
 }
} finally {await rm(root,{recursive:true,force:true});}
