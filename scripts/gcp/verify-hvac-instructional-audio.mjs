import {spawnSync} from 'node:child_process';
import {loadGoogleConfig} from './runtime-config.mjs';
const env=loadGoogleConfig('lms').runtimeEnvironment;
const base=env.NEXT_PUBLIC_SUPABASE_URL||env.SUPABASE_URL;
if(base!=='https://cuxzzpsyufcewtmicszk.supabase.co')throw Error('HVAC_DATABASE_REQUIRED');
const request=async(url,headers)=>{const r=await fetch(url,{headers,redirect:'error',signal:AbortSignal.timeout(20000)});if(!r.ok){const failure=await r.json().catch(()=>null);const code=/^[a-z_]{1,60}$/.test(failure?.code||'')?failure.code:'rejected';throw Error('HVAC_MEDIA_LOOKUP_FAILED:'+r.status+':'+code)}return r.json()};
const lessons=await request(base+'/rest/v1/course_lessons?course_id=eq.d48c61c4-8880-4d9d-9ab5-fab4dd51b201&is_published=eq.true&status=eq.published&lesson_type=eq.lesson&select=id,video_url',{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY});
if(lessons.length!==17)throw Error('EXPECTED_17_INSTRUCTIONAL_LESSONS');
const media=loadGoogleConfig('ultimate-worker').runtimeEnvironment;
const id=media.ELEVATE_MEDIA_ACCESS_KEY_ID||env.ELEVATE_MEDIA_ACCESS_KEY_ID;
const secret=media.ELEVATE_MEDIA_SECRET_ACCESS_KEY||env.ELEVATE_MEDIA_SECRET_ACCESS_KEY;
if(!id||!secret)throw Error('EXISTING_MEDIA_CONFIGURATION_REQUIRED');
const auth=await request('https://api.backblazeb2.com/b2api/v4/b2_authorize_account',{Authorization:'Basic '+Buffer.from(id+':'+secret).toString('base64')});
const download=auth.apiInfo?.storageApi?.downloadUrl;
if(!/^https:\/\/f[0-9]+\.backblazeb2\.com$/.test(download||'')||!auth.authorizationToken)throw Error('VERIFIED_B2_DOWNLOAD_HOST_REQUIRED');
const results=[];
for(const lesson of lessons){
 const source=new URL(lesson.video_url);let key;
 if(source.hostname==='s3.us-east-005.backblazeb2.com'&&source.pathname.startsWith('/elevate-course-media/'))key=decodeURIComponent(source.pathname.slice('/elevate-course-media/'.length));
 else if(source.hostname==='elevate-course-media.s3.us-east-005.backblazeb2.com')key=decodeURIComponent(source.pathname.slice(1));
 if(!key||key.split('/').some(x=>!x||x==='.'||x==='..'))throw Error('OWNED_HVAC_MEDIA_REFERENCE_REQUIRED');
 const url=download+'/file/elevate-course-media/'+key.split('/').map(encodeURIComponent).join('/');
 const probe=spawnSync('ffprobe',['-v','error','-headers','Authorization: '+auth.authorizationToken+'\r\n','-show_entries','stream=codec_type:format=duration','-of','json',url],{encoding:'utf8',timeout:60000,maxBuffer:1024*1024});
 let info;try{info=JSON.parse(probe.stdout)}catch{throw Error('HVAC_AUDIO_PROBE_FAILED:'+lesson.id)}
 if(probe.status!==0||!info.streams?.some(x=>x.codec_type==='audio')||!info.streams?.some(x=>x.codec_type==='video')||Number(info.format?.duration)<30)throw Error('HVAC_NARRATED_VIDEO_NOT_VERIFIED:'+lesson.id);
 results.push({lessonId:lesson.id,audio:true,video:true,durationSeconds:Math.round(Number(info.format.duration))});
}
console.log(JSON.stringify({verified:true,lessons:results,studentRecordsChanged:false,valuesExposed:false}));
