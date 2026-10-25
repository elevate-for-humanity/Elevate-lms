import {readFile,writeFile,mkdtemp,rm,stat} from 'node:fs/promises';
import {existsSync,createReadStream} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {KokoroTTS} from 'kokoro-js';
import {S3Client,PutObjectCommand,HeadObjectCommand} from '@aws-sdk/client-s3';
import {alignRecordedNarration} from '../../lib/video/forced-alignment.mjs';
import {orientationKeyForGuide} from '../../lib/orientation/media-contract.mjs';
const run=promisify(execFile);
const guides=JSON.parse(await readFile('/source/lib/orientation/dashboard-orientations.json','utf8'));
const root=await mkdtemp(join(tmpdir(),'dashboard-orientation-'));
const endpoint=process.env.ELEVATE_MEDIA_ENDPOINT, bucket=process.env.ELEVATE_MEDIA_BUCKET;
if(!/^https:\/\/s3\.[a-z0-9-]+\.backblazeb2\.com\/?$/.test(endpoint??'')||!bucket)throw Error('ORIENTATION_B2_CONFIGURATION_REQUIRED');
const client=new S3Client({endpoint,region:process.env.ELEVATE_MEDIA_REGION,forcePathStyle:false,requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED',
 credentials:{accessKeyId:process.env.ELEVATE_MEDIA_ACCESS_KEY_ID,secretAccessKey:process.env.ELEVATE_MEDIA_SECRET_ACCESS_KEY}});
let narrator;
const time=value=>{const ms=Math.max(0,Math.round(value*1000));return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`;};
const wrap=(text,width)=>{let line='',lines=[];for(const word of text.split(/\s+/)){if((line+' '+word).trim().length>width&&line){lines.push(line);line='';}line+=(line?' ':'')+word;}if(line)lines.push(line);return lines.join('\n');};
async function present(key){try{await client.send(new HeadObjectCommand({Bucket:bucket,Key:key}));return true;}catch(e){if(e.$metadata?.httpStatusCode===404||e.name==='NotFound')return false;throw Error('ORIENTATION_STORAGE_CHECK_FAILED');}}
async function upload(key,file,type){await client.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:createReadStream(file),ContentLength:(await stat(file)).size,ContentType:type,CacheControl:'private,max-age=3600'}));if(!await present(key))throw Error('ORIENTATION_UPLOAD_READBACK_FAILED');}
try {
 for(const [audience,guide] of Object.entries(guides)) {
  const videoKey=orientationKeyForGuide(audience,'mp4',guide),captionKey=orientationKeyForGuide(audience,'vtt',guide);
  if(await present(videoKey)&&await present(captionKey)){console.log(JSON.stringify({audience,status:'existing_verified'}));continue;}
  narrator??=await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:'q8',device:'cpu',local_files_only:true});
  const parts=[];let offset=0;const fullCaptions=['WEBVTT\n'];
  for(let i=0;i<guide.slides.length;i++) {
   const slide=guide.slides[i],prefix=join(root,`${audience}-${i}`);
   const audio=await narrator.generate(slide.narration,{voice:'af_heart',speed:1});
   const samples=audio.audio??audio.data;
   if(!samples?.length||audio.sampling_rate!==24000)throw Error('ORIENTATION_NARRATION_INVALID');
   const rms=Math.sqrt(samples.reduce((sum,value)=>sum+value*value,0)/samples.length);
   if(!Number.isFinite(rms)||rms<0.00001)throw Error('ORIENTATION_NARRATION_INAUDIBLE');
   const seconds=samples.length/24000,pcm=Buffer.alloc(samples.length*4);
   for(let j=0;j<samples.length;j++)pcm.writeFloatLE(samples[j],j*4);
   await writeFile(prefix+'.f32',pcm);
   await run('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','f32le','-ar','24000','-ac','1','-i',prefix+'.f32',prefix+'.wav'],{timeout:60000});
   const words=await alignRecordedNarration(prefix+'.wav',slide.narration);
   if(words.length<10||words.at(-1).end<seconds*.75)throw Error('ORIENTATION_CAPTION_ALIGNMENT_FAILED');
   const captions=['WEBVTT\n'];
   for(let j=0;j<words.length;j+=8){const group=words.slice(j,j+8),start=group[0].start,end=Math.min(seconds,group.at(-1).end+.08),text=group.map(w=>w.word??w.text).join(' ');captions.push(`${time(start)} --> ${time(end)}\n${text}\n`);fullCaptions.push(`${time(offset+start)} --> ${time(offset+end)}\n${text}\n`);}
   await writeFile(prefix+'.vtt',captions.join('\n'));
   await writeFile(prefix+'-title.txt',wrap(slide.title,28));
   await writeFile(prefix+'-points.txt',slide.points.map((p,n)=>wrap(`${n+1}. ${p}`,33)).join('\n\n'));
   const image=resolve('/source/public'+slide.image);
   if(!existsSync(image))throw Error('ORIENTATION_IMAGE_MISSING');
   const filter=`[0:v]scale=620:430:force_original_aspect_ratio=decrease,pad=620:430:(ow-iw)/2:(oh-ih)/2:color=0x171717,setsar=1,fade=t=in:st=0:d=0.75[photo];color=c=0x171717:s=1280x720:r=24[base];[base][photo]overlay=35:155,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='ELEVATE  |  DASHBOARD ORIENTATION':x=40:y=28:fontsize=17:fontcolor=0xcdb795,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${String(i+1).padStart(2,'0')} / ${guide.slides.length}':x=40:y=85:fontsize=28:fontcolor=0xcdb795,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:textfile=${prefix}-title.txt:expansion=none:x=695:y=95:fontsize=32:fontcolor=white:line_spacing=8,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile=${prefix}-points.txt:expansion=none:x=695:y=260:fontsize=23:fontcolor=0xf5e6cc:line_spacing=7,drawbox=x=0:y=605:w=1280:h=115:color=black:t=fill,subtitles=${prefix}.vtt:force_style='FontName=DejaVu Sans,FontSize=19,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=1,Alignment=2,MarginV=15,MarginL=40,MarginR=40'[out]`;
   const video=prefix+'.mp4';
   await run('ffmpeg',['-y','-hide_banner','-loglevel','error','-loop','1','-framerate','24','-i',image,'-i',prefix+'.wav','-filter_complex',filter,'-map','[out]','-map','1:a:0','-t',String(seconds),'-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-ac','2','-movflags','+faststart',video],{timeout:300000,maxBuffer:2*1024*1024});
   const {stdout}=await run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',video],{timeout:15000});
   if(Math.abs(Number(stdout)-seconds)>.3)throw Error('ORIENTATION_ENCODE_DURATION_MISMATCH');
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
