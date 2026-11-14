import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const run=promisify(execFile);
export const COURSE='a6b0b712-1cf0-475a-ba79-ee2023dea8ec';
export const LESSON='0811f5b7-eeff-428e-bad1-bfa78a791998';
const ORIGIN='https://cuxzzpsyufcewtmicszk.supabase.co';
export function storedMediaReference(source){
 const u=new URL(source),prefix='/storage/v1/object/public/course_videos/';
 if(u.origin!==ORIGIN||!u.pathname.startsWith(prefix)||u.search||u.hash)throw Error('EXACT_STORED_MEDIA_REQUIRED');
 const key=decodeURIComponent(u.pathname.slice(prefix.length));
 if(!key.startsWith(COURSE+'/')||key.split('/').some(x=>!x||x==='.'||x==='..')||/[\\\x00-\x1f]/.test(key))throw Error('EXACT_COURSE_MEDIA_REQUIRED');
 return {bucket:'course_videos',key};
}
export async function main(){
 const token=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!token)throw Error('DATABASE_AUTH_REQUIRED');
 const headers={apikey:token,Authorization:'Bearer '+token};
 const response=await fetch(ORIGIN+'/rest/v1/course_lessons?id=eq.'+LESSON+'&course_id=eq.'+COURSE+'&select=id,course_id,title,video_url,content_json,script_text,script,media_quality_status',{headers,signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('CANONICAL_READ_HTTP_'+response.status);
 const lessons=await response.json();if(lessons.length!==1)throw Error('EXACT_LESSON_REQUIRED');
 const lesson=lessons[0],reference=storedMediaReference(lesson.video_url);
 if(lesson.content_json?.manualProduction!==true||lesson.content_json?.film?.url!==lesson.video_url)throw Error('PRESERVED_MANUAL_FILM_REQUIRED');
 const signed=await fetch(ORIGIN+'/storage/v1/object/sign/'+reference.bucket+'/'+reference.key,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:900}),signal:AbortSignal.timeout(20000)});
 if(!signed.ok)throw Error('SIGN_HTTP_'+signed.status);
 const signedData=await signed.json();
 if(typeof signedData.signedURL!=='string'||!signedData.signedURL.startsWith('/object/sign/'+reference.bucket+'/'+reference.key+'?'))throw Error('SIGNED_REFERENCE_REQUIRED');
 const signedURL=new URL(ORIGIN+'/storage/v1'+signedData.signedURL);
 if(signedURL.origin!==ORIGIN)throw Error('SIGNED_ORIGIN_REQUIRED');
 const media=await fetch(signedURL,{signal:AbortSignal.timeout(60000)});if(!media.ok)throw Error('MEDIA_READ_HTTP_'+media.status);
 const bytes=Buffer.from(await media.arrayBuffer());
 const out=process.env.AUDIT_OUTPUT_DIR||'preserved-media-audit';await mkdir(out,{recursive:true});
 const file=join(out,'preserved-checkpoint.mp4');await writeFile(file,bytes);
 const sourceScript=lesson.script_text||lesson.script;
 if(typeof sourceScript!=='string'||!sourceScript.trim())throw Error('CANONICAL_SCRIPT_REQUIRED');
 await writeFile(join(out,'canonical-script.txt'),sourceScript);
 const probe=JSON.parse((await run('ffprobe',['-v','error','-show_format','-show_streams','-of','json',file],{timeout:60000,maxBuffer:1024*1024})).stdout);
 const duration=Number(probe.format?.duration);if(!Number.isFinite(duration)||duration<=0)throw Error('MEASURED_DURATION_REQUIRED');
 await run('ffmpeg',['-hide_banner','-v','error','-xerror','-i',file,'-map','0:v:0','-map','0:a:0','-f','null','-'],{timeout:120000,maxBuffer:1024*1024});
 const measurements=await run('ffmpeg',['-hide_banner','-i',file,'-vf','blackdetect=d=0.5:pix_th=0.10','-af','silencedetect=noise=-40dB:d=1','-f','null','-'],{timeout:120000,maxBuffer:4*1024*1024});
 const frames=[];
 for(const [index,time]of [Math.min(2,duration/4),duration/2,Math.max(0,duration-3)].entries()){
  const frame=join(out,'sample-'+index+'.png');
  await run('ffmpeg',['-hide_banner','-loglevel','error','-ss',String(time),'-i',file,'-frames:v','1','-y',frame],{timeout:30000});
  const ocr=await run('tesseract',[frame,'stdout','--psm','11'],{timeout:30000,maxBuffer:1024*1024});
  frames.push({time,frame:'sample-'+index+'.png',decodedText:ocr.stdout});
 }
 const evidence={courseId:COURSE,lessonId:LESSON,checkedAt:new Date().toISOString(),mediaSha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,durationSeconds:duration,decodePassed:true,streams:probe.streams.map(s=>({type:s.codec_type,codec:s.codec_name,width:s.width,height:s.height})),measuredEvents:measurements.stderr.split('\n').filter(x=>/black_start|silence_start|silence_end/.test(x)),samples:frames,captionReferencePresent:!!lesson.content_json?.film?.captions,existingQualityStatus:lesson.media_quality_status,instructionalAcceptanceVerified:false,learnerPlaybackVerified:false,databaseMutations:0};
 await writeFile(join(out,'evidence.json'),JSON.stringify(evidence,null,2));
 console.log(JSON.stringify(evidence));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
