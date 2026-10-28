import {pathToFileURL} from 'node:url';
import {loadGoogleConfig} from './runtime-config.mjs';
const COURSE='a6b0b712-1cf0-475a-ba79-ee2023dea8ec';
export function parseVtt(input){
 if(!/^WEBVTT(?:\s|$)/.test(input))throw Error('caption_format');
 const seconds=value=>{const p=value.split(':').map(Number);return p.length===3?p[0]*3600+p[1]*60+p[2]:p[0]*60+p[1];};
 const cues=[];let end=0;
 for(const block of input.replace(/\r/g,'').split(/\n\s*\n/)){
  const lines=block.split('\n'),idx=lines.findIndex(x=>x.includes('-->'));
  if(idx<0)continue;
  const match=lines[idx].match(/((?:\d{2}:)?\d{2}:\d{2}\.\d{3})\s+-->\s+((?:\d{2}:)?\d{2}:\d{2}\.\d{3})/);
  if(!match)throw Error('caption_time');
  const start=seconds(match[1]),finish=seconds(match[2]);
  const text=lines.slice(idx+1).join(' ').replace(/<[^>]*>/g,'').trim();
  if(!Number.isFinite(start)||!Number.isFinite(finish)||finish<=start||start<0||finish>7200)throw Error('caption_bounds');
  if(text){if(cues.length&&start<cues.at(-1).time)throw Error('caption_order');cues.push({time:start,text});end=Math.max(end,finish);}
 }
 if(!cues.length)throw Error('caption_empty');return {cues,end};
}
async function boundedText(response,max){
 if(!response.ok)throw Error('http_'+response.status);
 const reader=response.body.getReader();let n=0,parts=[];
 for(;;){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>max){await reader.cancel();throw Error('response_too_large');}parts.push(value);}
 return Buffer.concat(parts).toString('utf8');
}
export async function restore(){
 const env=loadGoogleConfig('admin').runtimeEnvironment;
 const base=(env.NEXT_PUBLIC_SUPABASE_URL||env.SUPABASE_URL||'').replace(/\/$/,'');
 if(base!=='https://cuxzzpsyufcewtmicszk.supabase.co'||!env.SUPABASE_SERVICE_ROLE_KEY)throw Error('bootstrap_unavailable');
 const headers={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'};
 const api=async(path,init={})=>JSON.parse(await boundedText(await fetch(base+'/rest/v1/'+path,{...init,headers:{...headers,...init.headers},redirect:'error',signal:AbortSignal.timeout(30000)}),8*1024*1024));
 const fields='id,order_index,video_url,duration_minutes,updated_at,filmVideo:content_json->film->>videoUrl,filmDuration:content_json->film->>duration,captionsUrl:content_json->film->>captionsUrl,transcript:content_json->experience->interactiveVideo->transcript,timelineCaptions:content_json->experience->instructionalTimeline->captions';
 const rows=await api('course_lessons?course_id=eq.'+COURSE+'&is_published=eq.true&select='+encodeURIComponent(fields)+'&order=order_index');
 for(const row of rows){
  if(row.transcript?.length||row.timelineCaptions?.length)continue;
  try{
   const sameFilm=row.filmVideo&&row.filmVideo.split('?')[0]===row.video_url?.split('?')[0];
   const managed=row.video_url==='/api/courses/'+COURSE+'/lessons/'+row.id+'/playback';
   if(!sameFilm&&!managed)throw Error('published_source_not_matched');
   const url=new URL(row.captionsUrl);
   const match=url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign)\/(course[-_]videos)\/(.+\.vtt)$/);
   if(url.origin!==base||!match)throw Error('caption_source_not_allowed');
   let response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000)});
   if(!response.ok){
    const signing=await fetch(base+'/storage/v1/object/sign/'+match[1]+'/'+match[2],{method:'POST',headers,body:JSON.stringify({expiresIn:60}),redirect:'error',signal:AbortSignal.timeout(15000)});
    const signed=JSON.parse(await boundedText(signing,20000));
    const target=signed.signedURL||signed.signedUrl;
    const signedUrl=new URL(target.startsWith('/object/')?'/storage/v1'+target:target,base);
    if(signedUrl.origin!==base)throw Error('caption_signed_origin');
    response=await fetch(signedUrl,{redirect:'error',signal:AbortSignal.timeout(15000)});
   }
   const parsed=parseVtt(await boundedText(response,1024*1024));
   const current=(await api('course_lessons?id=eq.'+row.id+'&course_id=eq.'+COURSE+'&select=id,video_url,content_json,duration_minutes,updated_at'))[0];
   if(!current||current.video_url!==row.video_url||current.updated_at!==row.updated_at)throw Error('source_changed');
   const content=current.content_json||{},experience=content.experience||{};
   if(experience.interactiveVideo?.transcript?.length||experience.instructionalTimeline?.captions?.length)continue;
   const updated={...content,experience:{...experience,interactiveVideo:{...(experience.interactiveVideo||{}),transcript:parsed.cues}}};
   const duration=Number(row.filmDuration)>0?Number(row.filmDuration):parsed.end;
   const body={content_json:updated,updated_at:new Date().toISOString(),...(Number(current.duration_minutes)>0?{}:{duration_minutes:Math.ceil(duration/60)})};
   const guard=current.updated_at?'updated_at=eq.'+encodeURIComponent(current.updated_at):'updated_at=is.null';
   const saved=await api('course_lessons?id=eq.'+row.id+'&course_id=eq.'+COURSE+'&'+guard+'&select=id',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(body)});
   if(saved.length!==1)throw Error('concurrent_change');
   console.log(JSON.stringify({lesson:row.order_index,status:'restored',captionCues:parsed.cues.length,durationMinutes:body.duration_minutes||current.duration_minutes}));
  }catch(error){console.log(JSON.stringify({lesson:row.order_index,status:'preserved',reason:/^[a-z0-9_]+$/.test(error.message)?error.message:'source_unavailable'}));}
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)restore().catch(()=>{console.error('COURSE_METADATA_RESTORE_FAILED');process.exitCode=1;});
