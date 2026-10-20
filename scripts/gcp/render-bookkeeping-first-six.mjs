#!/usr/bin/env node
/**
 * Render Elevate Bookkeeping lessons 1–6 with Google Cloud TTS and existing
 * lesson illustrations. Upload verified MP4s to Supabase, then attach to lessons.
 *
 * Required runtime: Node 22+, ffmpeg, ffprobe, ADC (or GOOGLE_CLOUD_API_KEY),
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 *
 * Run: node scripts/gcp/render-bookkeeping-first-six.mjs --dry-run
 *      node scripts/gcp/render-bookkeeping-first-six.mjs --execute
 *
 * Never logs credential values. Does not publish the course or lessons.
 */
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const COURSE = '93039110-f571-4ff1-bd54-7114c74bfd25';
const BASE = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\/$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const dryRun = process.argv.includes('--dry-run');
const execute = process.argv.includes('--execute');
const voice = process.env.GOOGLE_TTS_VOICE || 'en-US-Neural2-F';
if (dryRun === execute) throw new Error('Pass exactly one of --dry-run or --execute.');
if (!BASE || !KEY) throw new Error('Supabase runtime variables unavailable.');
const headers = { apikey: KEY, authorization: 'Bearer ' + KEY };
function cmd(program, args, opts = {}) {
  return execFileSync(program, args, { stdio: ['ignore','pipe','pipe'], ...opts });
}
async function readLessons() {
  const url = new URL('/rest/v1/training_lessons', BASE);
  url.searchParams.set('course_id', 'eq.' + COURSE);
  url.searchParams.set('lesson_number', 'gte.1');
  url.searchParams.set('lesson_number', 'lte.6');
  url.searchParams.set('select', 'id,lesson_number,title,content,video_url,is_published');
  url.searchParams.set('order', 'lesson_number.asc');
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Lesson lookup failed: HTTP ' + response.status);
  const rows = await response.json();
  if (rows.length !== 6 || rows.some((r,i) => r.lesson_number !== i + 1)) throw new Error('Expected exactly lessons 1 through 6');
  return rows;
}
function cleanText(html) {
  return html.replace(/<figure[\\s\\S]*?<\\/figure>/gi,' ')
    .replace(/<script[\\s\\S]*?<\\/script>/gi,' ')
    .replace(/<style[\\s\\S]*?<\\/style>/gi,' ')
    .replace(/<\\/(?:p|li|h[1-6]|div)>/gi,'. ')
    .replace(/<[^>]*>/g,' ')
    .replace(/&amp;/g,'and').replace(/&nbsp;/g,' ')
    .replace(/&lt;/g,'less than ').replace(/&gt;/g,'greater than ')
    .replace(/&quot;/g,'"').replace(/&#39;/g,"'")
    .replace(/\\s+/g,' ').trim();
}
function chunks(text, limit = 2200) {
  const out = []; let rest = text;
  while(rest.length > limit) {
    const part = rest.slice(0,limit);
    let index = Math.max(part.lastIndexOf('. '),part.lastIndexOf('? '),part.lastIndexOf('! '));
    if(index < 1000) index = part.lastIndexOf(' ');
    if(index <= 0) throw new Error('Narration cannot be split safely');
    out.push(rest.slice(0,index+1).trim());rest = rest.slice(index+1).trim();
  }
  if(rest)out.push(rest);
  return out;
}
function bearer() {
  if (process.env.GOOGLE_CLOUD_API_KEY) return { 'x-goog-api-key':process.env.GOOGLE_CLOUD_API_KEY };
  const token = cmd('gcloud',['auth','print-access-token'],{encoding:'utf8'}).trim();
  if(!token)throw new Error('Google Cloud application identity unavailable');
  return { authorization:'Bearer '+token };
}
async function narration(text, folder) {
  const files = [];
  const auth = bearer();
  let index=0;
  for(const part of chunks(text)) {
    const response=await fetch('https://texttospeech.googleapis.com/v1/text:synthesize',{
      method:'POST',headers:{...auth,'content-type':'application/json'},
      body:JSON.stringify({input:{text:part},voice:{languageCode:'en-US',name:voice},
        audioConfig:{audioEncoding:'MP3',speakingRate:0.95}}),
      signal:AbortSignal.timeout(45000)});
    if(!response.ok)throw new Error('Google TTS failed: HTTP '+response.status);
    const data=await response.json();
    if(typeof data.audioContent!=='string')throw new Error('Google TTS returned no audio');
    const file=path.join(folder,'voice-'+index+++'.mp3');
    await writeFile(file,Buffer.from(data.audioContent,'base64'));files.push(file);
  }
  const list=path.join(folder,'audio-list.txt');
  await writeFile(list,files.map(x=>"file '"+x.replaceAll("'","'\\''")+"'").join('\\n')+'\\n');
  const joined=path.join(folder,'narration.m4a');
  cmd('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',list,'-c:a','aac','-b:a','160k',joined]);
  return joined;
}
async function illustration(html, folder) {
  const match=html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if(!match)throw new Error('Lesson lacks approved image');
  const url=new URL(match[1]);
  if(url.protocol!=='https:' || url.hostname!=='cuxzzpsyufcewtmicszk.supabase.co' || !url.pathname.startsWith('/storage/v1/object/public/images/'))
    throw new Error('Unapproved illustration host');
  const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
  if(!response.ok || !(response.headers.get('content-type')||'').startsWith('image/'))throw new Error('Approved image download failed: '+response.status);
  const filename=path.join(folder,'visual');
  await writeFile(filename,Buffer.from(await response.arrayBuffer()));
  return filename;
}
async function renderLesson(lesson) {
  const folder=await mkdtemp(path.join(tmpdir(),'elevate-bookkeeping-'));
  try{
    const narrationText = cleanText(lesson.content || '');
    if(narrationText.length<500 || /Instructional draft/i.test(narrationText)) throw new Error('Lesson '+lesson.lesson_number+' is still placeholder instruction');
    const image=await illustration(lesson.content,folder);
    const audio=await narration(narrationText,folder);
    const output=path.join(folder,'final.mp4');
    // Loop a genuine course image behind synchronized spoken instruction.
    cmd('ffmpeg',['-hide_banner','-loglevel','error','-y','-loop','1','-framerate','24','-i',image,
      '-i',audio,'-vf',"scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
      '-c:v','libx264','-preset','veryfast','-crf','23','-c:a','aac','-b:a','160k','-movflags','+faststart','-shortest',output]);
    const probe=JSON.parse(cmd('ffprobe',['-v','error','-show_streams','-show_format','-of','json',output],{encoding:'utf8'}));
    if(!probe.streams.some(s=>s.codec_type==='video')||!probe.streams.some(s=>s.codec_type==='audio')||Number(probe.format.duration)<15)
      throw new Error('Video/audio verification failed');
    const objectPath='bookkeeping-160h/lesson-'+String(lesson.lesson_number).padStart(2,'0')+'-elevate-google-voice.mp4';
    const bytes=await (await import('node:fs/promises')).readFile(output);
    const upload=await fetch(BASE+'/storage/v1/object/media/'+objectPath,{
      method:'POST',headers:{...headers,'content-type':'video/mp4','x-upsert':'false'},
      body:bytes,signal:AbortSignal.timeout(120000)});
    if(!upload.ok)throw new Error('Media upload failed: HTTP '+upload.status+' (will not overwrite existing file)');
    const publicUrl=BASE+'/storage/v1/object/public/media/'+objectPath;
    const save=await fetch(BASE+'/rest/v1/training_lessons?id=eq.'+lesson.id+'&course_id=eq.'+COURSE,{
      method:'PATCH',headers:{...headers,'content-type':'application/json',prefer:'return=representation'},
      body:JSON.stringify({video_url:publicUrl}),signal:AbortSignal.timeout(15000)});
    if(!save.ok)throw new Error('Lesson attachment failed: HTTP '+save.status);
    const rows=await save.json();
    if(rows.length!==1||rows[0].video_url!==publicUrl)throw new Error('Lesson attachment readback failed');
    return {lesson:lesson.lesson_number,status:'attached',duration:Math.round(Number(probe.format.duration))};
  } finally {await rm(folder,{recursive:true,force:true});}
}
const lessons=await readLessons();
if(dryRun){
  for(const l of lessons)console.log(JSON.stringify({lesson:l.lesson_number,title:l.title,
    image: /<img[^>]+src=/.test(l.content||''),narrationChars:cleanText(l.content||'').length,
    needsScript: /Instructional draft/i.test(l.content||''),attachedVideo:Boolean(l.video_url)}));
}else{
  cmd('ffmpeg',['-version']);cmd('ffprobe',['-version']);
  for(const l of lessons){
    if(l.video_url){console.log(JSON.stringify({lesson:l.lesson_number,status:'existing_video_preserved'}));continue;}
    try{console.log(JSON.stringify(await renderLesson(l)));}
    catch(err){console.error(JSON.stringify({lesson:l.lesson_number,status:'blocked',reason:String(err.message||err)}));process.exitCode=1;}
  }
}
