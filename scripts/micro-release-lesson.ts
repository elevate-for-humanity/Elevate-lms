#!/usr/bin/env tsx
/** Safely release or rollback one canonical HVAC lesson video. */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
const BUCKET='course-videos', OUT_DIR='/tmp/hvac-videos', ROLLBACK_LOG='/tmp/hvac-videos/rollback.json';
type Entry={lessonId:string;oldVideoUrl:string|null;newVideoUrl:string;timestamp:string};
function log():Entry[]{return fs.existsSync(ROLLBACK_LOG)?JSON.parse(fs.readFileSync(ROLLBACK_LOG,'utf8')):[]}
function save(v:Entry[]){fs.mkdirSync(path.dirname(ROLLBACK_LOG),{recursive:true});fs.writeFileSync(ROLLBACK_LOG,JSON.stringify(v,null,2))}
async function resolveLesson(lessonId:string){
 const {data:lesson,error}=await supabase.from('course_lessons').select('id,title,module_id,video_url').eq('id',lessonId).single(); if(error||!lesson) throw new Error(`Canonical lesson not found: ${lessonId}`);
 const {data:mod,error:me}=await supabase.from('course_modules').select('id,course_id').eq('id',lesson.module_id).single(); if(me||!mod) throw new Error('Canonical module not found');
 const {data:course,error:ce}=await supabase.from('courses').select('id,title,slug').eq('id',mod.course_id).single(); if(ce||!course) throw new Error('Canonical course not found');
 if(!`${course.slug} ${course.title}`.toLowerCase().includes('hvac')) throw new Error('Refusing release: lesson does not belong to HVAC course'); return lesson;
}
async function verify(url:string){const r=await fetch(url,{method:'HEAD'});return (r.status===200||r.status===206)&&(r.headers.get('content-type')||'').includes('video/mp4')}
async function upload(lessonId:string){
 const lesson=await resolveLesson(lessonId); const local=path.join(OUT_DIR,`${lessonId}.mp4`); if(!fs.existsSync(local)) throw new Error(`Video not found: ${local}`);
 const previous=log().filter(e=>e.lessonId===lessonId); const storagePath=`hvac/${lessonId}-v${previous.length+1}.mp4`;
 const {error}=await supabase.storage.from(BUCKET).upload(storagePath,fs.readFileSync(local),{contentType:'video/mp4',upsert:false}); if(error) throw error;
 const publicUrl=supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl; if(!(await verify(publicUrl))) throw new Error(`Uploaded video failed verification: ${publicUrl}`);
 const entry:Entry={lessonId,oldVideoUrl:lesson.video_url||null,newVideoUrl:publicUrl,timestamp:new Date().toISOString()}; const entries=log(); entries.push(entry); save(entries);
 const {error:updateError}=await supabase.from('course_lessons').update({video_url:publicUrl}).eq('id',lessonId); if(updateError) throw updateError;
 console.log(`Released ${lesson.title}: ${publicUrl}`);
}
async function rollback(lessonId:string){await resolveLesson(lessonId); const entries=log().filter(e=>e.lessonId===lessonId); const latest=entries.at(-1); if(!latest) throw new Error(`No rollback entry for ${lessonId}`); const {error}=await supabase.from('course_lessons').update({video_url:latest.oldVideoUrl}).eq('id',lessonId); if(error) throw error; console.log(`Rolled back ${lessonId}`)}
async function main(){const id=process.argv[2];if(!id)throw new Error('Usage: micro-release-lesson.ts <canonical-course-lesson-id> [--rollback]');if(process.argv.includes('--rollback'))await rollback(id);else await upload(id)}
main().catch(e=>{console.error(e instanceof Error?e.message:e);process.exit(1)});
